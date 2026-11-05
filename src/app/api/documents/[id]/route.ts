import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { service } from '@/lib/server';
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return endpoint(req, async () => {
    const { id } = await ctx.params;
    const doc = await service.download(token(req), id);
    return new Response(new Uint8Array(doc.bytes), {
      headers: {
        'Content-Type': doc.mime,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
        'Cache-Control': 'no-store',
      },
    });
  });
}
