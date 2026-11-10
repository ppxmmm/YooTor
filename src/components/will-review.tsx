'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { emptyWillReview, reviewWill, type WillReview } from '@/lib/will-review';

type Document = { id: string; name: string };
type Item = { id: string; name: string; beneficiaryIds?: string[] };
type AnswerKey = 'datePresent' | 'signature' | 'handwritten' | 'handwrittenDate' | 'signedWithWitnesses' | 'witnessEligibility' | 'beneficiaryConflict' | 'alterations' | 'alterationsSigned' | 'uncertainty' | 'courtOrder';
export function WillReviewPanel({ initial, documents, assets, contacts, save, showSavedResult = false, onDirtyChange }: { initial?: WillReview; documents: Document[]; assets: Item[]; contacts: Item[]; save: (data: WillReview) => Promise<unknown>; showSavedResult?: boolean; onDirtyChange: (dirty: boolean) => void }) {
  const [data, setData] = useState<WillReview>({ ...emptyWillReview, ...initial });
  const [savedAnswers, setSavedAnswers] = useState(() => JSON.stringify({ ...emptyWillReview, ...initial }));
  const [result, setResult] = useState(showSavedResult);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saveCount, setSaveCount] = useState(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (saveCount > 0 && result) resultHeading.current?.scrollIntoView({ block: 'center' });
  }, [saveCount, result]);
  function update<K extends keyof WillReview>(key: K, value: WillReview[K]) {
    const next = { ...data, [key]: value };
    setData(next);
    onDirtyChange(JSON.stringify(next) !== savedAnswers);
    setResult(false);
    setMessage('');
  }
  function question(key: AnswerKey, label: string) {
    return <label className="field" key={key}><span>{label}</span><select value={data[key] || ''} onChange={e => update(key, e.target.value as WillReview[typeof key])}>
      <option value="">เลือกคำตอบ</option><option value="yes">ใช่</option><option value="no">ไม่ใช่</option><option value="unknown">ไม่แน่ใจ</option>
    </select></label>;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (step < 2) { setStep(step + 1); return; } setBusy(true); setMessage('');
    try { await save(data); setSavedAnswers(JSON.stringify(data)); onDirtyChange(false); setResult(true); setMessage('บันทึกคำตอบแล้ว'); setSaveCount(count => count + 1); }
    catch { setMessage('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { setBusy(false); }
  }
  const findings = reviewWill({ ...data, documentId: documents.some(d => d.id === data.documentId) ? data.documentId : '' });
  const selectedContacts = contacts.filter(contact => data.beneficiaryIds?.includes(contact.id));
  const normalized = (value: string) => value.trim().toLocaleLowerCase('th');
  const relatedNames = [data.writerName || '', ...(data.witnessNames || [])].map(normalized).filter(Boolean);
  const potentialOverlap = selectedContacts.some(contact => relatedNames.includes(normalized(contact.name)));
  const unmatchedAssets = assets.filter(asset => data.assetIds?.includes(asset.id) && asset.beneficiaryIds?.some(id => !data.beneficiaryIds?.includes(id)));
  return <section className="panel stack" aria-labelledby="will-review-title">
    <div><h2 id="will-review-title">ตรวจทานพินัยกรรมเบื้องต้น</h2><p className="muted">ตอบตามข้อมูลที่ทราบ ระบบช่วยรวบรวมประเด็นให้ตรวจเพิ่มเติม โดยยังไม่ได้อ่านหรือยืนยันความแท้ของเอกสาร</p></div>
    {!result && <form className="stack" onSubmit={submit}>
      <div className="will-step-indicator" aria-label={`ขั้นที่ ${step + 1} จาก 3`}>ขั้นที่ {step + 1} จาก 3 · {step === 0 ? "เอกสารและผู้ทำ" : step === 1 ? "ข้อมูลเพื่อตรวจ" : "ทบทวนก่อนบันทึก"}</div>
      <div className="stack will-step" hidden={step !== 0}>
      <div className="form-grid">
        <label className="field"><span>ประเภทพินัยกรรม</span><select value={data.form} onChange={e => update('form', e.target.value as WillReview['form'])}><option value="">เลือกประเภท</option><option value="handwritten">เขียนเองทั้งฉบับ</option><option value="ordinary">แบบธรรมดา</option></select></label>
        <label className="field"><span>ชื่อผู้ทำพินัยกรรม</span><input value={data.name} maxLength={200} onChange={e => update('name', e.target.value)} /></label>
        <label className="field"><span>วันเกิดผู้ทำ</span><input type="date" value={data.birthDate} onChange={e => update('birthDate', e.target.value)} /></label>
        <label className="field"><span>วันที่ทำพินัยกรรม</span><input type="date" value={data.signedDate} onChange={e => update('signedDate', e.target.value)} /></label>
        <label className="field"><span>เอกสารประกอบในคลังเอกสาร</span><select value={data.documentId} onChange={e => update('documentId', e.target.value)}><option value="">ยังไม่ได้เลือก</option>{documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      </div>
      <p className="muted">หากยังไม่ได้อัปโหลด สามารถเพิ่มไฟล์ใน <Link href="/app/documents">คลังเอกสาร</Link> แล้วกลับมาเลือกได้</p>
      </div>
      <div className="stack will-step" hidden={step !== 1}><p className="muted">ตอบตามข้อมูลที่ทราบ หากไม่แน่ใจสามารถเลือก “ไม่แน่ใจ” ได้</p>
      <div className="form-grid">
        {question('datePresent', 'เอกสารระบุวัน เดือน ปีครบหรือไม่')}
        {question('signature', 'มีลายมือชื่อผู้ทำในเอกสารหรือไม่')}
        {question('courtOrder', 'ณ วันที่ทำ มีคำสั่งศาลเกี่ยวกับความสามารถของผู้ทำหรือไม่')}
        {data.form === 'handwritten' && <>{question('handwritten', 'ข้อความทั้งหมดเขียนด้วยลายมือผู้ทำเองหรือไม่')}{question('handwrittenDate', 'วันที่เขียนด้วยลายมือผู้ทำเองหรือไม่')}</>}
        {data.form === 'ordinary' && <>{question('signedWithWitnesses', 'ผู้ทำลงชื่อและพยานลงชื่อรับรองต่อหน้ากันในขณะนั้นหรือไม่')}<label className="field"><span>จำนวนพยาน</span><select value={data.witnessCount} onChange={e => update('witnessCount', e.target.value as WillReview['witnessCount'])}><option value="">เลือกจำนวน</option><option value="0">ไม่มี</option><option value="1">1 คน</option><option value="2plus">2 คนขึ้นไป</option><option value="unknown">ไม่แน่ใจ</option></select></label>{question('witnessEligibility', 'ได้ตรวจคุณสมบัติและการลงชื่อของพยานแล้วหรือไม่')}{question('beneficiaryConflict', 'ผู้รับเป็นผู้เขียน พยาน หรือคู่สมรสของบุคคลดังกล่าวหรือไม่')}</>}
        {question('alterations', 'มีการขูดลบ ตกเติม หรือแก้ไขหรือไม่')}
        {data.alterations === 'yes' && question('alterationsSigned', 'ได้ลงชื่อกำกับทุกจุดที่แก้ไขหรือไม่')}
        {question('uncertainty', 'มีข้อสงสัยอื่นเกี่ยวกับการทำพินัยกรรมหรือไม่')}
      </div>
      {data.form === 'ordinary' && <div className="stack will-people-fields"><h3>ผู้เขียนและพยาน</h3><p className="muted">ระบุเท่าที่ทราบ เพื่อช่วยสังเกตชื่อที่อาจซ้ำกับผู้รับ ข้อมูลนี้ไม่ยืนยันตัวตนหรือสิทธิของบุคคล</p><div className="form-grid"><label className="field"><span>ชื่อผู้เขียนหรือผู้พิมพ์</span><input maxLength={200} value={data.writerName || ''} onChange={e => update('writerName', e.target.value)} /></label>{[0, 1].map(i => <label className="field" key={i}><span>ชื่อพยานคนที่ {i + 1}</span><input maxLength={200} value={data.witnessNames?.[i] || ''} onChange={e => { const names = [...(data.witnessNames || ['', ''])]; names[i] = e.target.value; update('witnessNames', names); }} /></label>)}</div></div>}
      {data.form === 'ordinary' && [0, 1].map(i => {
        const witness = data.witnesses?.[i] || { birthDate: '', signedTogether: '', spouseOfBeneficiary: '' };
        function updateWitness(field: 'birthDate' | 'signedTogether' | 'spouseOfBeneficiary', value: string) {
          const witnesses = [0, 1].map(index => data.witnesses?.[index] || { birthDate: '', signedTogether: '', spouseOfBeneficiary: '' });
          witnesses[i] = { ...witnesses[i], [field]: value };
          update('witnesses', witnesses as NonNullable<WillReview['witnesses']>);
        }
        return <fieldset className="will-link-field will-witness-field" key={i}><legend>รายละเอียดพยานคนที่ {i + 1} (ถ้าทราบ)</legend><div className="form-grid"><label className="field">วันเกิด<input type="date" value={witness.birthDate} onChange={e => updateWitness('birthDate', e.target.value)} /></label><label className="field">ลงชื่อรับรองในขณะผู้ทำลงชื่อหรือไม่<select value={witness.signedTogether} onChange={e => updateWitness('signedTogether', e.target.value)}><option value="">ยังไม่ระบุ</option><option value="yes">ใช่</option><option value="no">ไม่ใช่</option><option value="unknown">ไม่แน่ใจ</option></select></label><label className="field">เป็นคู่สมรสของผู้รับทรัพย์หรือไม่<select value={witness.spouseOfBeneficiary} onChange={e => updateWitness('spouseOfBeneficiary', e.target.value)}><option value="">ยังไม่ระบุ</option><option value="yes">ใช่</option><option value="no">ไม่ใช่</option><option value="unknown">ไม่แน่ใจ</option></select></label></div></fieldset>;
      })}
      <div className="stack will-people-fields"><h3>เชื่อมข้อมูลประกอบ</h3><p className="muted">เลือกข้อมูลที่เกี่ยวข้องได้ตามต้องการ ระบบยังไม่ได้อ่านพินัยกรรมเพื่อยืนยันการจัดสรรทรัพย์สิน</p>
        <fieldset className="will-link-field"><legend>ทรัพย์สินที่เกี่ยวข้อง</legend>{assets.length ? assets.map(item => <label key={item.id}><input type="checkbox" checked={data.assetIds?.includes(item.id) || false} onChange={e => update('assetIds', e.target.checked ? [...(data.assetIds || []), item.id] : (data.assetIds || []).filter(id => id !== item.id))} /> {item.name}</label>) : <p className="muted">ยังไม่มีทรัพย์สินในทะเบียน</p>}</fieldset>
        <fieldset className="will-link-field"><legend>ผู้รับที่เกี่ยวข้องจากบุคคลที่บันทึกไว้</legend>{contacts.length ? contacts.map(item => <label key={item.id}><input type="checkbox" checked={data.beneficiaryIds?.includes(item.id) || false} onChange={e => update('beneficiaryIds', e.target.checked ? [...(data.beneficiaryIds || []), item.id] : (data.beneficiaryIds || []).filter(id => id !== item.id))} /> {item.name}</label>) : <p className="muted">ยังไม่มีบุคคลในทะเบียน</p>}</fieldset>
      </div>
      </div>
      <div className="stack will-step" hidden={step !== 2}>
        <h3>ทบทวนก่อนบันทึก</h3>
        <p>ผู้ทำ: {data.name || 'ยังไม่ระบุ'} · ประเภท: {data.form === 'handwritten' ? 'เขียนเองทั้งฉบับ' : data.form === 'ordinary' ? 'แบบธรรมดา' : 'ยังไม่ระบุ'}</p>
        <p className="muted">เอกสาร: {documents.find(d => d.id === data.documentId)?.name || 'ยังไม่ได้เลือก'} · ทรัพย์สิน {data.assetIds?.length || 0} รายการ · บุคคล {data.beneficiaryIds?.length || 0} คน</p>
        <p className="muted">ระบบจะประเมินจากคำตอบของคุณ โดยยังไม่อ่านไฟล์หรือรับรองผลทางกฎหมาย</p>
      </div>
      <div className="wp-actions will-step-actions">
        {step > 0 && <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>ย้อนกลับ</button>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : step < 2 ? 'ถัดไป' : 'บันทึกและตรวจทาน'}</button>
      </div>
    </form>}
    {message && <p role="status">{message}</p>}
    {result && <div className="stack will-review-result" aria-live="polite"><div><span className="will-review-result-label">ผลตรวจทานเบื้องต้น</span><h3 id="will-review-result-title" ref={resultHeading}>{findings.length || potentialOverlap || unmatchedAssets.length ? `มีประเด็นที่ควรตรวจเพิ่มเติม` : 'ยังไม่พบประเด็นจากคำตอบที่ตรวจ'}</h3><p className="muted">ประเมินจากคำตอบที่บันทึกไว้ ระบบยังไม่ได้อ่านเอกสาร</p></div>{findings.some(item => item.level === 'missing') && <h4>ข้อมูลที่ยังขาดหรือไม่แน่ใจ</h4>}{findings.filter(item => item.level === 'missing').map((item, i) => <div className="notice" key={`missing-${i}`}><div><strong>{item.label}</strong><p>{item.detail}</p></div></div>)}{(findings.some(item => item.level === 'review') || potentialOverlap || unmatchedAssets.length > 0) && <h4>ประเด็นที่ควรให้ผู้เชี่ยวชาญตรวจ</h4>}{findings.filter(item => item.level === 'review').map((item, i) => <div className="notice" key={`review-${i}`}><div><strong>{item.label}</strong><p>{item.detail}</p>{item.reference && <small>{item.reference} · รอผู้เชี่ยวชาญตรวจยืนยัน</small>}</div></div>)}{potentialOverlap && <div className="notice"><div><strong>อาจมีชื่อผู้รับตรงกับพยานหรือผู้เขียน</strong><p>ชื่อตรงกันไม่ได้ยืนยันว่าเป็นบุคคลเดียวกัน กรุณาตรวจข้อเท็จจริงกับผู้เชี่ยวชาญ</p></div></div>}{unmatchedAssets.map(asset => <div className="notice" key={asset.id}><div><strong>ตรวจผู้รับที่ตั้งใจไว้สำหรับ {asset.name}</strong><p>รายชื่อผู้รับที่เลือกในการตรวจนี้ไม่ครอบคลุมผู้รับที่บันทึกไว้ในทะเบียนทรัพย์สิน โปรดตรวจการจัดสรรอีกครั้ง</p></div></div>)}<p className="muted">ผลนี้อ้างอิงคำตอบที่คุณให้และ baseline ฉบับร่าง ไม่รับรองความถูกต้องหรือผลทางกฎหมาย ควรให้ผู้เชี่ยวชาญตรวจเอกสารและข้อเท็จจริง</p><button type="button" className="btn btn-secondary will-review-edit" onClick={() => { setResult(false); setStep(0); setMessage(''); }}>ดูหรือแก้ไขคำตอบ</button></div>}
  </section>;
}
