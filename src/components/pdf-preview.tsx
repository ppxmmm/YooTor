'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';

/** Render pixels only; never execute PDF actions, forms, attachments or scripts. */
export function DocumentPreview({
  url,
  mime,
  name,
}: {
  url: string;
  mime: string;
  name: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1),
    [pages, setPages] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const pdf = mime === 'application/pdf';
  useEffect(() => {
    if (!pdf) return;
    let active = true;
    let destroy: (() => void) | undefined;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const engine = await import('pdfjs-dist');
        if (!active) return;
        engine.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
        const task = engine.getDocument({
          data: bytes,
          cMapUrl: '/pdf/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdf/standard_fonts/',
          wasmUrl: '/pdf/wasm/',
        });
        destroy = () => {
          void task.destroy();
        };
        const document = await task.promise;
        if (!active) return;
        setPages(document.numPages);
        const sheet = await document.getPage(page);
        if (!active || !canvas.current) return;
        const base = sheet.getViewport({ scale: 1 });
        const viewport = sheet.getViewport({
          scale: Math.min(900 / base.width, 1.5),
        });
        const element = canvas.current;
        element.width = Math.ceil(viewport.width);
        element.height = Math.ceil(viewport.height);
        const context = element.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        await sheet.render({
          canvas: element,
          canvasContext: context,
          viewport,
        }).promise;
        if (active) setLoading(false);
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          console.warn(
            'PDF renderer:',
            error instanceof Error ? error.message : String(error),
          );
        if (active) {
          setError(
            'ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้ กรุณาดาวน์โหลดเพื่อเปิดด้วยโปรแกรมที่รองรับ',
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
      destroy?.();
    };
  }, [url, page, pdf]);
  if (!pdf)
    return (
      <div className="image-preview">
        {/* Blob URLs are authenticated private images; no image optimizer fetch. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} />
      </div>
    );
  return (
    <div className="pdf-preview">
      <div className="pdf-controls">
        <button
          className="btn btn-small btn-secondary"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => p - 1)}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          หน้า {page} / {pages || '…'}
        </span>
        <button
          className="btn btn-small btn-secondary"
          disabled={page >= pages || loading}
          onClick={() => setPage((p) => p + 1)}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {loading && (
        <p className="pdf-loading" role="status">
          <LoaderCircle className="spin" size={18} />
          กำลังเตรียมตัวอย่างเอกสาร…
        </p>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <canvas
        ref={canvas}
        role="img"
        aria-label={`${name} หน้า ${page}`}
        style={{ display: error ? 'none' : 'block' }}
      />
    </div>
  );
}
