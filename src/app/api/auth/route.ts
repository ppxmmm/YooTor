import { readJson } from '@/lib/http';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { endpoint, token, sessionCookie } from '@/lib/http';
import { service } from '@/lib/server';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  return endpoint(req, async () => {
    const body = z.record(z.string(), z.unknown()).parse(await readJson(req));
    if (body.action === 'logout') {
      await service.logout(token(req));
      const res = NextResponse.json({ ok: true });
      sessionCookie(res, '');
      return res;
    }
    const result = await service.auth(
      body,
      req.cookies.get('saan_household')?.value,
    );
    const res = NextResponse.json({ user: result.user });
    sessionCookie(res, result.token);
    if (result.user.demo)
      sessionCookie(res, result.household, 'saan_household');
    return res;
  });
}
