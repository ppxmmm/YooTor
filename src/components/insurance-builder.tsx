'use client';
import { useState, type FormEvent } from 'react';
export function InsuranceBuilder({
  save,
}: {
  save: (data: Record<string, unknown>) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [beneficiaryKind, setBeneficiaryKind] = useState('named');
  const [beneficiaries, setBeneficiaries] = useState([0]);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const names = data.getAll('beneficiaryName').map(String);
    const relationships = data.getAll('beneficiaryRelationship').map(String);
    const shares = data.getAll('beneficiaryShare').map(String);
    const people = names.map((name, index) => ({ name: name.trim(), relationship: (relationships[index] || '').trim(), share: shares[index] ? Number(shares[index]) : null }));
    if (beneficiaryKind === 'named' && people.some(p => !p.name)) { setError('กรุณาระบุชื่อผู้รับประโยชน์แต่ละคน'); return; }
    if (people.some(p => p.share !== null) && people.every(p => p.share !== null) && Math.abs(people.reduce((sum, p) => sum + (p.share || 0), 0) - 100) > 0.001) { setError('หากระบุสัดส่วนครบทุกคน ผลรวมต้องเท่ากับ 100%'); return; }
    setError('');
    setBusy(true);
    try {
      await save({
        name: String(data.get('company')),
        category: 'insurance',
        reference: String(data.get('policy')),
        value: Number(data.get('coverage')),
        status: 'complete',
        notes: `ช่องทางติดต่อเรียกร้องสิทธิ: ${data.get('contact')}\nที่เก็บเอกสารกรมธรรม์: ${data.get('document')}`,
        insurance: {
          insured: String(data.get('insured') || ''), policyType: String(data.get('policyType')), policyStatus: String(data.get('policyStatus')),
          startDate: String(data.get('startDate') || ''), endDate: String(data.get('endDate') || ''),
          beneficiaryKind, beneficiaries: people,
          premiumsPaid: data.get('premiumsPaid') ? Number(data.get('premiumsPaid')) : null,
        },
      });
      form.reset();
      setBeneficiaries([0]); setBeneficiaryKind('named');
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
          <label className="field">ประเภทกรมธรรม์<select name="policyType"><option value="life">ชีวิต</option><option value="accident">อุบัติเหตุ</option><option value="health">สุขภาพ</option><option value="pension">บำนาญ</option><option value="savings">สะสมทรัพย์</option><option value="other">อื่น ๆ</option></select></label>
          <label className="field">สถานะกรมธรรม์<select name="policyStatus" defaultValue="unknown"><option value="unknown">ยังไม่แน่ใจ</option><option value="active">มีผลบังคับ</option><option value="lapsed">ขาดอายุ</option><option value="matured">ครบสัญญา</option><option value="claimed">เคลมแล้ว</option></select></label>
          <label className="field">วันเริ่มคุ้มครอง<input name="startDate" type="date" /></label>
          <label className="field">วันสิ้นสุดความคุ้มครอง<input name="endDate" type="date" /></label>
          <label className="field">
            ทุนประกัน (บาท)
            <input name="coverage" type="number" required min="0" step="0.01" />
          </label>
          <label className="field">
            ช่องทางติดต่อบริษัท / ตัวแทน
            <input name="contact" required maxLength={300} />
          </label>
        </div>
        <label className="field">การระบุผู้รับประโยชน์<select name="beneficiaryKind" value={beneficiaryKind} onChange={e => setBeneficiaryKind(e.target.value)}><option value="named">ระบุชื่อบุคคล</option><option value="heirs">ระบุว่าเป็นทายาท</option><option value="none">ไม่ได้ระบุ</option><option value="unknown">ยังไม่แน่ใจ</option></select></label>
        {beneficiaryKind === 'named' && <div className="stack"><strong>ผู้รับประโยชน์</strong>{beneficiaries.map((key, index) => <div className="form-grid" key={key}><label className="field">{index === 0 ? 'ผู้รับประโยชน์ตามกรมธรรม์' : `ชื่อผู้รับคนที่ ${index + 1}`}<input name="beneficiaryName" maxLength={200} required /></label><label className="field">ความสัมพันธ์<input name="beneficiaryRelationship" maxLength={100} /></label><label className="field">สัดส่วน (%) ถ้าทราบ<input name="beneficiaryShare" type="number" min="0" max="100" step="0.01" /></label>{index > 0 && <button type="button" className="btn btn-secondary btn-small" onClick={() => setBeneficiaries(items => items.filter(item => item !== key))}>ลบผู้รับคนที่ {index + 1}</button>}</div>)}<button type="button" className="btn btn-secondary" disabled={beneficiaries.length >= 20} onClick={() => setBeneficiaries(items => [...items, Math.max(...items) + 1])}>เพิ่มผู้รับประโยชน์</button></div>}
        <label className="field">เบี้ยที่ชำระแล้วรวม (บาท) หากทราบ<input name="premiumsPaid" type="number" min="0" step="0.01" /></label>
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
        {error && <p role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'กำลังบันทึก…' : 'บันทึกกรมธรรม์'}
        </button>
      </form>
    </details>
  );
}
