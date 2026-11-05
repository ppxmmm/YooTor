import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { service } from '@/lib/server';
export async function GET(req: NextRequest) {
  return endpoint(
    req,
    async () =>
      new Response(JSON.stringify(await service.state(token(req)), null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="yootor-export.json"',
        },
      }),
  );
}
