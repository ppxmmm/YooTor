'use client';
import { useState, type FormEvent } from 'react';
export function InsuranceBuilder({
  save,
}: {
  save: (data: Record<string, unknown>) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      await save({
        name: String(data.get('company')),
        category: 'insurance',
        reference: String(data.get('policy')),
        value: Number(data.get('coverage')),
        status: 'complete',
        notes: `บริษัทประกัน: ${data.get('company')}\nผู้เอาประกัน: ${data.get('insured')}\nผู้รับประโยชน์: ${data.get('beneficiary')}\nช่องทางติดต่อเรียกร้องสิทธิ: ${data.get('contact')}\nที่เก็บเอกสารกรมธรรม์: ${data.get('document')}`,
      });
      form.reset();
    } catch {
      /* Shared mutation handler reports errors. */
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel stack">
      <summary>รวบรวมกรมธรรม์ประกันชีวิต — เพิ่มข้อมูลกรมธรรม์</summary>
      <form className="stack" onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            บริษัทประกัน
            <input name="company" required maxLength={200} />
          </label>
          <label className="field">
            เลขกรมธรรม์
            <input name="policy" required maxLength={200} />
          </label>
          <label className="field">
            ผู้เอาประกัน
            <input name="insured" required maxLength={200} />
          </label>
          <label className="field">
            ผู้รับประโยชน์ตามกรมธรรม์
            <input name="beneficiary" required maxLength={500} />
          </label>
          <label className="field">
            ทุนประกัน (บาท)
            <input name="coverage" type="number" required min="0" step="0.01" />
          </label>
          <label className="field">
            ช่องทางติดต่อบริษัท / ตัวแทน
            <input name="contact" required maxLength={300} />
          </label>
        </div>
        <label className="field">
          ที่เก็บเอกสารกรมธรรม์
          <input
            name="document"
            required
            maxLength={500}
            placeholder="เช่น คลังเอกสาร ชื่อไฟล์กรมธรรม์ หรือที่เก็บต้นฉบับ"
          />
        </label>
        <p className="muted">
          อัปโหลดสำเนาได้ที่คลังเอกสาร
          ทุนประกันไม่ใช่มูลค่ามรดกที่ต้องเสียภาษีโดยอัตโนมัติ
          และชื่อผู้รับในระบบไม่เปลี่ยนผู้รับประโยชน์ในกรมธรรม์
        </p>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'กำลังบันทึก…' : 'บันทึกกรมธรรม์'}
        </button>
      </form>
    </details>
  );
}
