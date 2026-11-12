import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './server';
const rates = new Map<string, { count: number; until: number }>();
export const token = (req: NextRequest) =>
  req.cookies.get('saan_session')?.value || '';
/** Bound memory use before parsing untrusted JSON route bodies. */
export async function readJson(req: NextRequest): Promise<unknown> {
  if (
    !req.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    throw new ApiError(415, 'รองรับข้อมูล JSON เท่านั้น');
  const max = 64 * 1024;
  if (Number(req.headers.get('content-length') || 0) > max)
    throw new ApiError(413, 'ข้อมูลมีขนาดใหญ่เกินไป');
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(422, 'กรุณาระบุข้อมูล');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new ApiError(413, 'ข้อมูลมีขนาดใหญ่เกินไป');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function endpoint(
  req: NextRequest,
  fn: () => Promise<Response | unknown>,
) {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      const origin = req.headers.get('origin');
      const requestUrl = new URL(req.url);
      const host = req.headers.get('host');
      const expected =
        process.env.APP_ORIGIN ||
        (host && process.env.NODE_ENV !== 'production'
          ? requestUrl.protocol + '//' + host
          : requestUrl.origin);
      if (origin !== expected) throw new ApiError(403, 'แหล่งคำขอไม่ถูกต้อง');
    }
    const key =
      (req.headers.get('x-forwarded-for') || 'local').split(',')[0] +
      (req.nextUrl.pathname === '/api/auth' ? ':auth' : ':api');
    const now = Date.now();
    if (rates.size > 5000) {
      for (const [key, value] of rates)
        if (value.until < now) rates.delete(key);
      if (rates.size > 5000)
        throw new ApiError(429, 'คำขอมากเกินไป กรุณารอสักครู่');
    }
    let limit = rates.get(key);
    if (!limit || limit.until < now) {
      limit = { count: 0, until: now + 60000 };
      rates.set(key, limit);
    }
    if (++limit.count > (key.endsWith(':auth') ? 20 : 150))
      throw new ApiError(429, 'คำขอมากเกินไป กรุณารอสักครู่');
    const result = await fn();
    const response =
      result instanceof Response ? result : NextResponse.json(result);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  } catch (error) {
    const status =
      error instanceof ApiError
        ? error.status
        : error instanceof ZodError || error instanceof SyntaxError
          ? 422
          : 500;
    if (status === 500) {
      const details = error && typeof error === 'object' ? error : {};
      const candidate =
        'code' in details ? details.code : 'errorCode' in details ? details.errorCode : undefined;
      const code =
        typeof candidate === 'string' && /^[A-Z0-9_]{1,32}$/.test(candidate)
          ? candidate
          : undefined;
      console.error('API request failed', {
        path: req.nextUrl.pathname,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        code,
      });
    }
    return NextResponse.json(
      {
        error:
          error instanceof ZodError || error instanceof SyntaxError
            ? 'กรุณาตรวจสอบข้อมูลที่กรอก แล้วลองอีกครั้ง'
            : status === 500
              ? 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่'
              : error instanceof Error
                ? error.message
                : 'ข้อมูลไม่ถูกต้อง',
      },
      {
        status,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  }
}
export function sessionCookie(
  response: NextResponse,
  value: string,
  name = 'saan_session',
) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: value ? 86400 : 0,
  });
}
