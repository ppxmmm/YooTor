import { readJson } from '@/lib/http';
import { NextRequest } from 'next/server';
import { endpoint, token } from '@/lib/http';
import { service, ApiError } from '@/lib/server';
export async function POST(req: NextRequest) {
  return endpoint(req, async () => {
    const current = await service.state(token(req));
    if (current.user.role !== 'OWNER')
      throw new ApiError(403, 'เจ้าของข้อมูลเท่านั้น');
    const contentType = req.headers.get('content-type') || '';
    if (!/^multipart\/form-data\s*;/i.test(contentType))
      throw new ApiError(422, 'กรุณาส่งไฟล์แบบ multipart/form-data');
    const length = req.headers.get('content-length');
    if (
      length !== null &&
      (!/^\d+$/.test(length) || Number(length) > 11 * 1024 * 1024)
    )
      throw new ApiError(413, 'ไฟล์ใหญ่เกินกำหนด');
    const reader = req.body?.getReader();
    if (!reader) throw new ApiError(422, 'ไม่พบไฟล์');
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 11 * 1024 * 1024) {
        await reader.cancel();
        throw new ApiError(413, 'ไฟล์ใหญ่เกินกำหนด');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let form: FormData;
    try {
      form = await new Response(bytes, {
        headers: { 'Content-Type': contentType },
      }).formData();
    } catch {
      throw new ApiError(422, 'รูปแบบไฟล์อัปโหลดไม่ถูกต้อง');
    }
    for (const key of form.keys())
      if (
        !['file', 'name', 'category'].includes(key) ||
        form.getAll(key).length !== 1
      )
        throw new ApiError(422, 'ฟิลด์อัปโหลดไม่ถูกต้องหรือซ้ำกัน');
    const file = form.get('file'),
      name = form.get('name'),
      category = form.get('category');
    if (!(file instanceof File)) throw new ApiError(422, 'กรุณาเลือกไฟล์');
    if (
      (name !== null && typeof name !== 'string') ||
      (category !== null && typeof category !== 'string')
    )
      throw new ApiError(422, 'ชื่อและหมวดเอกสารต้องเป็นข้อความ');
    return service.upload(
      token(req),
      {
        name: file.name,
        mime: file.type,
        bytes: Buffer.from(await file.arrayBuffer()),
      },
      name || file.name,
      category || 'general',
    );
  });
}
export async function DELETE(req: NextRequest) {
  return endpoint(req, async () =>
    service.mutate(token(req), 'documents', 'DELETE', await readJson(req)),
  );
}
