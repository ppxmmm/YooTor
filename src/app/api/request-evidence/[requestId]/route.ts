import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { ApiError, service } from '@/lib/server';
export async function POST(req: NextRequest, ctx: { params: Promise<{ requestId: string }> }) {
  return endpoint(req, async () => {
    const state = await service.state(token(req));
    if (!state.user.demo || state.user.role !== 'FAMILY') throw new ApiError(403, 'ใช้ได้เฉพาะสมาชิกครอบครัวในโหมดทดลอง');
    const type = req.headers.get('content-type') || '';
    if (!/^multipart\/form-data\s*;/i.test(type)) throw new ApiError(422, 'กรุณาเลือกไฟล์');
    const reader = req.body?.getReader();
    if (!reader) throw new ApiError(422, 'ไม่พบไฟล์');
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 2 * 1024 * 1024 + 65536) { await reader.cancel(); throw new ApiError(413, 'ไฟล์ใหญ่เกินกำหนด'); }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': type } }).formData();
    if (Array.from(form.keys()).some(key => key !== 'file') || form.getAll('file').length !== 1) throw new ApiError(422, 'ข้อมูลไม่ถูกต้อง');
    const file = form.get('file');
    if (!(file instanceof File)) throw new ApiError(422, 'กรุณาเลือกไฟล์');
    const { requestId } = await ctx.params;
    return service.uploadRequestEvidence(token(req), requestId, { name: file.name, bytes: Buffer.from(await file.arrayBuffer()) });
  });
}
