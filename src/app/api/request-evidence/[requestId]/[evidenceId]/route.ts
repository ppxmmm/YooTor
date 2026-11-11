import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { service } from '@/lib/server';
export async function GET(req: NextRequest, ctx: { params: Promise<{ requestId: string; evidenceId: string }> }) {
  return endpoint(req, async () => {
    const { requestId, evidenceId } = await ctx.params;
    const file = await service.downloadRequestEvidence(token(req), requestId, evidenceId);
    return new Response(new Uint8Array(file.bytes), { headers: { 'Content-Type': file.mime, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}` } });
  });
}
