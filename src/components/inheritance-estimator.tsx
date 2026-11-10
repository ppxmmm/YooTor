'use client';
import { useState, type FormEvent } from 'react';
import { estimateInheritanceTax, formatSatang } from '@/lib/inheritance-estimate';

export function InheritanceEstimator() {
  const [result, setResult] = useState<ReturnType<typeof estimateInheritanceTax> | null>(null);
  const [usedRate, setUsedRate] = useState<5 | 10>(5);
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get('confirmed') !== 'yes') { setError('กรุณายืนยันเงื่อนไขของตัวอย่างก่อนคำนวณ'); return; }
    const rawAssets = String(form.get('assets') || '').trim(), rawDebt = String(form.get('debt') || '').trim();
    if (!/^\d+$/.test(rawAssets) || !/^\d+$/.test(rawDebt)) { setError('กรุณาระบุมูลค่าและหนี้เป็นจำนวนเต็มบาท หากไม่มีหนี้ให้ระบุ 0'); return; }
    const rate = Number(form.get('rate')) as 5 | 10;
    try { setResult(estimateInheritanceTax({ assets: Number(rawAssets), debt: Number(rawDebt), rate })); setUsedRate(rate); setError(''); }
    catch (e) { setResult(null); setError((e as Error).message); }
  }
  return <section className="panel inheritance-estimator stack" aria-labelledby="estimate-title">
    <div><h2 id="estimate-title">ทดลองประเมินภาษีการรับมรดก</h2><p className="muted">ตัวอย่างสำหรับผู้รับ 1 คน จากเจ้ามรดก 1 คน เพื่อทำความเข้าใจวิธีคิด ไม่ใช่ยอดภาษีที่ต้องชำระจริง</p></div>
    <p className="notice">รองรับเฉพาะกรณีสมมติที่ผู้รับไม่มีการรับมรดกจากเจ้ามรดกรายนี้มาก่อน ไม่มีภาษีที่ชำระไว้แล้ว และไม่มีข้อยกเว้นที่ต้องพิจารณา ตัวเลขที่กรอกต้องเป็นทรัพย์สินที่เข้าเกณฑ์และภาระหนี้ที่หักได้ซึ่งผู้ใช้ตรวจสอบแล้ว</p>
    <form className="stack" onSubmit={submit} onChange={() => { setResult(null); setError(''); }}>
      <div className="form-grid">
        <label className="field">มูลค่าทรัพย์สินที่เข้าเกณฑ์ซึ่งผู้รับได้รับ (บาท)<input name="assets" type="number" min="0" max="1000000000000" step="1" required /></label>
        <label className="field">ภาระหนี้ที่หักได้ของผู้รับ (บาท)<input name="debt" type="number" min="0" max="1000000000000" step="1" required placeholder="ไม่มีให้ใส่ 0" /></label>
        <label className="field">ความสัมพันธ์ที่ใช้จำลองอัตรา<select name="rate" required defaultValue=""><option value="">เลือกความสัมพันธ์</option><option value="5">บุพการีหรือผู้สืบสันดาน — 5%</option><option value="10">บุคคลอื่นที่ไม่ได้รับยกเว้น — 10%</option></select></label>
      </div>
      <label className="inheritance-confirm"><input type="checkbox" name="confirmed" value="yes" /> <span>ฉันเข้าใจว่าเป็นกรณีสมมติตามเงื่อนไขข้างต้น และได้ตรวจสอบตัวเลขที่นำมากรอกแล้ว</span></label>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary">ดูวิธีคำนวณ</button>
    </form>
    {result && <div className="wp-tax-result" aria-live="polite"><h3>ผลจำลองตามข้อมูลที่กรอก</h3><p>มูลค่าสุทธิ: {new Intl.NumberFormat('th-TH').format(result.net)} บาท</p><p>ส่วนเกิน 100 ล้านบาท: {new Intl.NumberFormat('th-TH').format(result.taxable)} บาท</p><p>อัตราสมมติ: {usedRate}%</p><strong>ผลคำนวณตัวอย่าง: {formatSatang(result.taxSatang)} บาท</strong><p>ตัวเลขนี้ไม่ยืนยันว่าต้องเสียหรือยื่นภาษี และไม่รวมกรณีอื่นที่อยู่นอกขอบเขต โปรดตรวจสอบข้อเท็จจริงกับกรมสรรพากรหรือผู้เชี่ยวชาญ</p></div>}
    <a href="https://www.rd.go.th/56662.html" target="_blank" rel="noreferrer">ดูวิธีคำนวณจากกรมสรรพากร ↗</a>
  </section>;
}
