import { z } from 'zod';

const answer = z.enum(['yes', 'no', 'unknown', '']);
export const willReviewSchema = z.object({
  form: z.enum(['', 'handwritten', 'ordinary']),
  name: z.string().trim().max(200),
  birthDate: z.string().max(10),
  signedDate: z.string().max(10),
  documentId: z.string().max(100),
  datePresent: answer,
  signature: answer,
  handwritten: answer,
  handwrittenDate: answer,
  signedWithWitnesses: answer,
  witnessCount: z.enum(['', '0', '1', '2plus', 'unknown']),
  witnessEligibility: answer,
  beneficiaryConflict: answer,
  alterations: answer,
  alterationsSigned: answer,
  uncertainty: answer,
  writerName: z.string().trim().max(200).optional(),
  witnessNames: z.array(z.string().trim().max(200)).max(10).optional(),
  courtOrder: answer.optional(),
  witnesses: z.array(z.object({ birthDate: z.string().max(10), signedTogether: answer, spouseOfBeneficiary: answer })).max(10).optional(),
  beneficiaryIds: z.array(z.string().max(100)).max(50).optional(),
  assetIds: z.array(z.string().max(100)).max(50).optional(),
});
export const savedWillReviewSchema = z.object({ id: z.string().min(1).max(100), data: willReviewSchema });
export type SavedWillReview = z.infer<typeof savedWillReviewSchema>;
export type WillReview = z.infer<typeof willReviewSchema>;
export const emptyWillReview: WillReview = {
  form: '', name: '', birthDate: '', signedDate: '', documentId: '',
  datePresent: '', signature: '', handwritten: '', handwrittenDate: '',
  signedWithWitnesses: '', witnessCount: '', witnessEligibility: '',
  beneficiaryConflict: '', alterations: '', alterationsSigned: '', uncertainty: '',
};
export type Finding = { label: string; detail: string; level: 'review' | 'missing'; reference?: string };
export function reviewWill(input: WillReview): Finding[] {
  const findings: Finding[] = [];
  const missing = (label: string) => findings.push({ label, detail: 'กรุณาระบุข้อมูล หรือเลือกไม่แน่ใจเพื่อตรวจเพิ่มเติม', level: 'missing' });
  const check = (value: string, label: string, risk: string, reference?: string) => {
    if (!value || value === 'unknown') missing(label);
    else if (value === 'no') findings.push({ label, detail: risk, level: 'review', reference });
  };
  if (!input.form) missing('ประเภทพินัยกรรม');
  if (!input.name) missing('ชื่อผู้ทำพินัยกรรม');
  if (!input.birthDate) missing('วันเกิดผู้ทำพินัยกรรม');
  if (!input.signedDate) missing('วันที่ทำพินัยกรรม');
  if (!input.documentId) missing('เอกสารประกอบ');
  if (!input.courtOrder || input.courtOrder === 'unknown') missing('คำสั่งศาลที่เกี่ยวข้อง');
  else if (input.courtOrder === 'yes') findings.push({label:'คำสั่งศาลที่เกี่ยวข้อง', detail:'ควรให้ผู้เชี่ยวชาญตรวจคำสั่งศาลและข้อเท็จจริง ณ วันที่ทำ', level:'review', reference:'อ้างอิงตาม baseline: ม. 1704'});
  if (input.birthDate && input.signedDate) {
    const birth = new Date(input.birthDate + 'T00:00:00Z');
    const signed = new Date(input.signedDate + 'T00:00:00Z');
    if (Number.isNaN(birth.getTime()) || Number.isNaN(signed.getTime()) || birth > signed) {
      findings.push({label:'วันที่', detail:'กรุณาตรวจวันเกิดและวันที่ทำพินัยกรรม', level:'review'});
    } else {
      let age = signed.getUTCFullYear() - birth.getUTCFullYear();
      if (signed.getUTCMonth() < birth.getUTCMonth() || (signed.getUTCMonth() === birth.getUTCMonth() && signed.getUTCDate() < birth.getUTCDate())) age--;
      if (age < 15) findings.push({label:'อายุผู้ทำ',detail:'อายุที่คำนวณได้ต่ำกว่า 15 ปี ณ วันที่ระบุ ควรให้ผู้เชี่ยวชาญตรวจ',level:'review',reference:'อ้างอิงตาม baseline: ม. 1703'});
    }
  }
  check(input.datePresent, 'วัน เดือน ปีในเอกสาร', 'ควรตรวจการระบุวัน เดือน ปีในเอกสาร', 'อ้างอิงตาม baseline: ม. 1656, 1657');
  check(input.signature, 'ลายมือชื่อผู้ทำ', 'ควรตรวจลายมือชื่อผู้ทำในเอกสาร', 'อ้างอิงตาม baseline: ม. 1656, 1657');
  if (input.form === 'handwritten') {
    check(input.handwritten, 'เขียนด้วยลายมือทั้งฉบับ', 'ควรตรวจว่าเอกสารเข้าข่ายรูปแบบที่เลือกหรือไม่', 'อ้างอิงตาม baseline: ม. 1657');
    check(input.handwrittenDate, 'วันที่เขียนด้วยลายมือผู้ทำ', 'ควรตรวจวันที่ในเอกสารกับผู้เชี่ยวชาญ', 'อ้างอิงตาม baseline: ม. 1657');
  }
  if (input.form === 'ordinary') {
    check(input.signedWithWitnesses, 'ลงนามต่อหน้าพยาน', 'ควรตรวจขั้นตอนการลงนามและพยานกับผู้เชี่ยวชาญ', 'อ้างอิงตาม baseline: ม. 1656');
    if (!input.witnessCount || input.witnessCount === 'unknown') missing('จำนวนพยาน');
    else if (input.witnessCount !== '2plus') findings.push({label:'จำนวนพยาน',detail:'จำนวนพยานที่ระบุน้อยกว่าสองคน ควรตรวจเพิ่มเติม',level:'review',reference:'อ้างอิงตาม baseline: ม. 1656'});
    check(input.witnessEligibility, 'คุณสมบัติและการลงนามของพยาน', 'ควรให้ผู้เชี่ยวชาญตรวจคุณสมบัติและการลงนามของพยาน', 'อ้างอิงตาม baseline: ม. 1670');
    if (!input.beneficiaryConflict || input.beneficiaryConflict === 'unknown') missing('ความเกี่ยวข้องของผู้รับกับพยานหรือผู้เขียน');
    else if (input.beneficiaryConflict === 'yes') findings.push({label:'ผู้รับเกี่ยวข้องกับพยานหรือผู้เขียน',detail:'อาจมีข้อกำหนดบางส่วนที่ต้องตรวจเพิ่มเติม ไม่ได้สรุปผลทั้งฉบับ',level:'review',reference:'อ้างอิงตาม baseline: ม. 1653'});
    for (const [index, witness] of (input.witnesses || []).entries()) {
      if (witness.signedTogether === 'no') findings.push({label:`การลงชื่อพยานคนที่ ${index + 1}`,detail:'ควรตรวจขั้นตอนการลงชื่อกับผู้เชี่ยวชาญ',level:'review',reference:'อ้างอิงตาม baseline: ม. 1656'});
      if (witness.spouseOfBeneficiary === 'yes') findings.push({label:`ความเกี่ยวข้องของพยานคนที่ ${index + 1}`,detail:'ควรตรวจความเกี่ยวข้องกับผู้รับและข้อกำหนดที่เกี่ยวข้อง',level:'review',reference:'อ้างอิงตาม baseline: ม. 1653'});
      if (witness.birthDate && input.signedDate && witness.birthDate > input.signedDate) findings.push({label:`วันเกิดพยานคนที่ ${index + 1}`,detail:'วันเกิดอยู่หลังวันที่ทำพินัยกรรม กรุณาตรวจข้อมูลอีกครั้ง',level:'review'});
    }
  }
  if (!input.alterations || input.alterations === 'unknown') missing('การแก้ไขในเอกสาร');
  else if (input.alterations === 'yes') {
    if (!input.alterationsSigned || input.alterationsSigned === 'unknown') missing('การลงนามกำกับจุดแก้ไข');
    else if (input.alterationsSigned === 'no') findings.push({label:'การแก้ไขในเอกสาร',detail:'ควรให้ผู้เชี่ยวชาญตรวจทุกจุดที่แก้ไข กฎสำหรับแต่ละแบบอาจต่างกัน',level:'review'});
  }
  if (!input.uncertainty || input.uncertainty === 'unknown') missing('ข้อสงสัยเพิ่มเติม');
  else if (input.uncertainty === 'yes') findings.push({label:'ข้อสงสัยเพิ่มเติม',detail:'ควรให้ผู้เชี่ยวชาญตรวจข้อเท็จจริงเพิ่มเติม',level:'review'});
  return findings;
}
