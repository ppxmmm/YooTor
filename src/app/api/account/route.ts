import { NextRequest, NextResponse } from 'next/server';
import { endpoint, token, sessionCookie } from '@/lib/http';
import { service } from '@/lib/server';
export async function DELETE(req: NextRequest) {
  return endpoint(req, async () => {
    await service.deleteAccount(token(req));
    const res = NextResponse.json({ ok: true });
    sessionCookie(res, '');
    sessionCookie(res, '', 'saan_household');
    return res;
  });
}
