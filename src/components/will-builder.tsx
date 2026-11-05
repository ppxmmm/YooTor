'use client';
import { useState, type FormEvent } from 'react';
import { buildWillDraft } from '@/lib/estate-planning';

export function WillBuilder({
  save,
  notify,
}: {
  save: (content: string) => Promise<unknown>;
  notify: (message: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = buildWillDraft({
      name: String(data.get('name') || ''),
      date: String(data.get('date') || ''),
      place: String(data.get('place') || ''),
      dispositions: String(data.get('dispositions') || ''),
      executor: String(data.get('executor') || ''),
    });
    setDraft(text);
  }
  async function persist() {
    setBusy(true);
    try {
      await save(draft);
    } catch {
      /* Shared mutation handler reports errors. */
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([draft], { type: 'text/plain;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'YooTor-will-draft.txt';
    link.click();
    URL.revokeObjectURL(url);
    notify('ดาวน์โหลดฉบับร่างแล้ว กรุณาทบทวนก่อนลงนาม');
  }
  return (
    <section className="panel stack">
      <h2>เขียนพินัยกรรม</h2>
      <p>
        ระบุทรัพย์สินและผู้รับให้ชัดเจน สร้างฉบับร่าง
        แล้วบันทึกไว้ในบัญชีหรือดาวน์โหลดไปทบทวนก่อนลงนาม
      </p>
      <form className="stack" onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            ชื่อและนามสกุลผู้ทำพินัยกรรม
            <input name="name" required maxLength={200} />
          </label>
          <label className="field">
            วันที่จัดทำ
            <input name="date" type="date" required />
          </label>
          <label className="field">
            สถานที่จัดทำ
            <input name="place" required maxLength={300} />
          </label>
          <label className="field">
            ผู้ที่ประสงค์ให้เป็นผู้จัดการมรดก
            <input name="executor" required maxLength={200} />
          </label>
        </div>
        <label className="field">
          ทรัพย์สิน ผู้รับ และสัดส่วนที่ต้องการยกให้
          <textarea
            name="dispositions"
            required
            maxLength={1800}
            rows={5}
            placeholder="ระบุทรัพย์สินให้ระบุตัวได้ ชื่อผู้รับ และจำนวนหรือสัดส่วนของแต่ละคน รวมถึงความประสงค์เกี่ยวกับทรัพย์สินที่เหลือ"
          />
        </label>
        <button className="btn btn-primary">สร้างฉบับร่างพินัยกรรม</button>
      </form>
      {draft && (
        <div className="stack">
          <label className="field">
            ทบทวนและแก้ไขฉบับร่าง
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={16}
              maxLength={4000}
            />
          </label>
          <div className="wp-actions">
            <button
              className="btn btn-primary"
              disabled={busy || !draft.trim()}
              onClick={() => void persist()}
            >
              {busy ? 'กำลังบันทึก…' : 'บันทึกพินัยกรรมฉบับร่าง'}
            </button>
            <button
              className="btn btn-secondary"
              disabled={!draft.trim()}
              onClick={download}
            >
              ดาวน์โหลดฉบับร่าง (.txt)
            </button>
          </div>
        </div>
      )}
      <p className="muted">
        การเก็บฉบับร่างในระบบไม่ทำให้เป็นพินัยกรรมที่สมบูรณ์โดยอัตโนมัติ
        ต้องตรวจข้อความและดำเนินการลงนามตามแบบที่กฎหมายกำหนด
      </p>
      <a
        href="https://www.dsi.go.th/Files/Images/กฎหมายเกี่ยวข้องกับวงจรชีวิต.pdf"
        target="_blank"
        rel="noreferrer"
      >
        แนวทางพินัยกรรมและการลงนาม — กรมสอบสวนคดีพิเศษ
      </a>
    </section>
  );
}
