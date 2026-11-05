import { copyFile, cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const source = join(process.cwd(), 'node_modules/pdfjs-dist');
await mkdir('public/pdf', { recursive: true });
await copyFile(
  join(source, 'build/pdf.worker.min.mjs'),
  'public/pdf.worker.min.mjs',
);
for (const folder of ['cmaps', 'standard_fonts', 'wasm'])
  await cp(join(source, folder), join('public/pdf', folder), {
    recursive: true,
  });
await copyFile(join(source, 'LICENSE'), 'public/pdf/LICENSE');
