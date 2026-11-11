'use client';
import { useState } from 'react';
type Beneficiary = { name: string; relationship: string; share: number | null };
type Policy = { insured: string; policyType: string; policyStatus: string; startDate: string; endDate: string; beneficiaryKind: string; beneficiaries: Beneficiary[]; premiumsPaid: number | null };
export function InsuranceEditFields({ policy, initiallyOpen = false }: { policy: Policy; initiallyOpen?: boolean }) {
  const [people, setPeople] = useState(() => policy.beneficiaries.map((person, id) => ({ ...person, id })));
  return <details className="asset-planning-fields" open={initiallyOpen || undefined}><summary>รายละเอียดกรมธรรม์และผู้รับประโยชน์</summary><div className="stack">
    <div className="form-grid">
      <label className="field">ผู้เอาประกัน<input name="policyInsured" defaultValue={policy.insured} maxLength={200} required /></label>
      <label className="field">ประเภทกรมธรรม์<select name="policyType" defaultValue={policy.policyType}><option value="life">ชีวิต</option><option value="accident">อุบัติเหตุ</option><option value="health">สุขภาพ</option><option value="pension">บำนาญ</option><option value="savings">สะสมทรัพย์</option><option value="other">อื่น ๆ</option></select></label>
      <label className="field">สถานะกรมธรรม์<select name="policyStatus" defaultValue={policy.policyStatus}><option value="unknown">ยังไม่แน่ใจ</option><option value="active">มีผลบังคับ</option><option value="lapsed">ขาดอายุ</option><option value="matured">ครบสัญญา</option><option value="claimed">เคลมแล้ว</option></select></label>
      <label className="field">วันเริ่มคุ้มครอง<input name="policyStart" type="date" defaultValue={policy.startDate} /></label>
      <label className="field">วันสิ้นสุดความคุ้มครอง<input name="policyEnd" type="date" defaultValue={policy.endDate} /></label>
      <label className="field">เบี้ยที่ชำระแล้วรวม (บาท)<input name="policyPremiums" type="number" min="0" max="100000000000000" step="any" defaultValue={policy.premiumsPaid ?? ''} /></label>
      <label className="field">การระบุผู้รับประโยชน์<select name="policyBeneficiaryKind" defaultValue={policy.beneficiaryKind}><option value="named">ระบุชื่อบุคคล</option><option value="heirs">ระบุว่าเป็นทายาท</option><option value="none">ไม่ได้ระบุ</option><option value="unknown">ยังไม่แน่ใจ</option></select></label>
    </div>
    <p className="muted">กรอกข้อมูลผู้รับเฉพาะกรณีระบุชื่อ หากระบุสัดส่วนครบทุกคน ผลรวมต้องเท่ากับ 100% หากเปลี่ยนรูปแบบผู้รับ กรุณาทบทวนรายชื่อเดิมด้วย</p>
    {people.map((person, index) => <div className="form-grid" key={person.id}>
      <label className="field">ชื่อผู้รับคนที่ {index + 1}<input name="policyBeneficiaryName" maxLength={200} defaultValue={person.name} /></label>
      <label className="field">ความสัมพันธ์<input name="policyBeneficiaryRelationship" maxLength={100} defaultValue={person.relationship} /></label>
      <label className="field">สัดส่วน (%)<input name="policyBeneficiaryShare" type="number" min="0" max="100" step="any" defaultValue={person.share ?? ''} /></label>
      <button type="button" className="btn btn-secondary btn-small" onClick={() => setPeople(items => items.filter(item => item.id !== person.id))}>ลบผู้รับคนที่ {index + 1}</button>
    </div>)}
    <button type="button" className="btn btn-secondary btn-small" disabled={people.length >= 20} onClick={() => setPeople(items => [...items, { id: Math.max(-1, ...items.map(p => p.id)) + 1, name: '', relationship: '', share: null }])}>เพิ่มผู้รับประโยชน์</button>
  </div></details>;
}

/** Only copy explicitly labelled values; the original notes remain untouched. */
export function LegacyInsuranceConverter({ notes }: { notes: string }) {
  const [converting, setConverting] = useState(false);
  const insured = notes.match(/(?:^|\n)\s*ผู้เอาประกัน\s*[:：]\s*([^\n]+)/)?.[1]?.trim() || '';
  const beneficiary = notes.match(/(?:^|\n)\s*ผู้รับประโยชน์\s*[:：]\s*([^\n]+)/)?.[1]?.trim() || '';
  return <div className="asset-planning-fields">
    {!converting ? <><p>กรมธรรม์รายการนี้บันทึกเป็นข้อความแบบเดิม สามารถเพิ่มข้อมูลแบบแยกช่องได้โดยเก็บข้อความเดิมไว้</p><button className="btn btn-secondary btn-small" type="button" onClick={() => setConverting(true)}>เพิ่มรายละเอียดกรมธรรม์</button></> : <>
      <input type="hidden" name="convertPolicy" value="yes" />
      <p className="muted">ตรวจสอบข้อมูลที่ดึงจากข้อความเดิมและแก้ไขให้ถูกต้องก่อนกดบันทึก ช่องที่ไม่ทราบสามารถเว้นไว้ได้ ข้อมูลเดิมจะยังอยู่</p>
      <InsuranceEditFields initiallyOpen policy={{ insured, policyType: 'other', policyStatus: 'unknown', startDate: '', endDate: '', beneficiaryKind: beneficiary ? 'named' : 'unknown', beneficiaries: beneficiary ? [{ name: beneficiary, relationship: '', share: null }] : [], premiumsPaid: null }} />
      <button className="btn btn-secondary btn-small" type="button" onClick={() => setConverting(false)}>ยกเลิกการเพิ่มรายละเอียด</button>
    </>}
  </div>;
}
