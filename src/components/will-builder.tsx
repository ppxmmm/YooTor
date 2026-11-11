'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { buildWillDraft } from '@/lib/estate-planning';
import { allocationDispositions, allocationStatus, type PlanAsset, type PlanContact } from '@/lib/allocation';

export function WillBuilder({ assets, contacts, save, notify }: {
  assets: PlanAsset[];
  contacts: PlanContact[];
  save: (content: string) => Promise<unknown>;
  notify: (message: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const candidates = assets.filter(asset => asset.category !== 'insurance');
  const chosen = candidates.filter(asset => selected.includes(asset.id));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      if (chosen.length !== selected.length) throw new Error('ข้อมูลทรัพย์สินเปลี่ยนไป กรุณาเลือกใหม่');
      const text = buildWillDraft({ name: String(data.get('name') || ''), date: String(data.get('date') || ''), place: String(data.get('place') || ''), executor: String(data.get('executor') || ''), dispositions: allocationDispositions(chosen, contacts) });
      if (text.length > 4000) throw new Error('ฉบับร่างยาวเกินขนาดที่บันทึกได้ กรุณาเลือกรายการให้น้อยลง');
      setDraft(text); setSaved(false); setError('');
    } catch (err) { setError((err as Error).message); }
  }
  async function persist() {
    setBusy(true); setError('');
    try { await save(draft); setSaved(true); }
    catch { setError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { setBusy(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'YooTor-will-draft.txt'; link.click(); URL.revokeObjectURL(url);
    notify('ดาวน์โหลดฉบับร่างแล้ว กรุณาทบทวนก่อนลงนาม');
  }
  return <section className="panel stack" aria-labelledby="will-builder-title">
    <div><h2 id="will-builder-title">เตรียมฉบับร่างจากแผนของคุณ</h2><p className="muted">เลือกเฉพาะทรัพย์สินที่ต้องการนำมาร่าง แล้วตรวจและแก้ไขข้อความก่อนบันทึกหรือดาวน์โหลด</p></div>
    <p className="notice">ฉบับร่างนี้ยังไม่ใช่พินัยกรรมที่ลงนามแล้ว โปรดตรวจรายการที่เลือก รายการที่ไม่ได้เลือก และรายละเอียดทั้งหมดกับผู้เชี่ยวชาญ</p>
    <form className="stack" onSubmit={submit}>
      <fieldset className="will-link-field"><legend>เลือกทรัพย์สินที่จะนำมาร่าง</legend>
        {!candidates.length && <p className="muted">ยังไม่มีทรัพย์สินสำหรับจัดสรร</p>}
        {candidates.map(asset => { const status = allocationStatus(asset, contacts); return <div key={asset.id} className="allocation-choice"><label><input type="checkbox" checked={selected.includes(asset.id)} disabled={!status.complete} onChange={e => setSelected(old => e.target.checked ? [...old, asset.id] : old.filter(id => id !== asset.id))} /> {asset.name}</label><span className="muted">{status.status} · {status.total}%</span></div>; })}
      </fieldset>
      <p className="muted">เลือกได้เมื่อระบุผู้รับและสัดส่วนรวมครบ 100% เท่านั้น <Link href="/app/assets">ไปจัดสรรทรัพย์สิน</Link> · กรมธรรม์แยกตรวจตามเงื่อนไขแต่ละฉบับ</p>
      <div className="form-grid">
        <label className="field">ชื่อและนามสกุลผู้ทำพินัยกรรม<input name="name" required maxLength={200} /></label>
        <label className="field">วันที่จัดทำ<input name="date" type="date" required /></label>
        <label className="field">สถานที่จัดทำ<input name="place" required maxLength={300} /></label>
        <label className="field">ผู้ที่ประสงค์ให้เป็นผู้จัดการมรดก<input name="executor" required maxLength={200} /></label>
      </div>
      <button className="btn btn-primary" disabled={!chosen.length}>สร้างข้อความฉบับร่าง</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {draft && <div className="stack"><label className="field">ทบทวนและแก้ไขฉบับร่าง<textarea rows={16} maxLength={4000} value={draft} onChange={e => { setDraft(e.target.value); setSaved(false); }} /></label><p className="muted">ข้อความนี้เป็นสำเนา ณ เวลาที่สร้าง หากแก้แผนทรัพย์สินภายหลัง ต้องกลับมาสร้างฉบับร่างใหม่ ข้อมูลที่ไม่ได้เลือกจะไม่ปรากฏ</p><div className="wp-actions"><button type="button" className="btn btn-primary" disabled={busy || saved || !draft.trim()} onClick={persist}>{saved ? 'บันทึกฉบับร่างแล้ว' : busy ? 'กำลังบันทึก…' : 'บันทึกฉบับร่าง'}</button><button type="button" className="btn btn-secondary" disabled={!draft.trim()} onClick={download}>ดาวน์โหลดฉบับร่าง</button></div>{saved && <p role="status">บันทึกในรายการฉบับร่างและความประสงค์ด้านล่างแล้ว</p>}</div>}
  </section>;
}
