'use client';
import { useState, type FormEvent } from 'react';

type Debt = { id: string; creditor: string; kind: 'loan' | 'credit' | 'personal' | 'expense' | 'other'; amount: number; asOf: string; security: 'yes' | 'no' | 'unknown'; assetId: string; notes: string };
type Asset = { id: string; name: string };
const kinds: Record<Debt['kind'], string> = { loan: 'สินเชื่อ', credit: 'บัตรเครดิต', personal: 'หนี้ส่วนบุคคล', expense: 'ค่าใช้จ่ายค้างชำระ', other: 'อื่น ๆ' };
export function DebtRegistry({ debts, assets, save }: { debts: Debt[]; assets: Asset[]; save: (debts: Debt[]) => Promise<unknown> }) {
  const [editing, setEditing] = useState<Debt | 'new' | null>(null);
  const [deleteId, setDeleteId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); const raw = String(form.get('amount') || ''); const amount = Number(raw);
    if (!raw.trim() || !Number.isFinite(amount) || amount < 0 || amount > 1e14) { setError('กรุณาระบุยอดหนี้ที่ถูกต้อง'); return; }
    const row: Debt = { id: editing && editing !== 'new' ? editing.id : crypto.randomUUID(), creditor: String(form.get('creditor') || '').trim(), kind: form.get('kind') as Debt['kind'], amount, asOf: String(form.get('asOf') || ''), security: form.get('security') as Debt['security'], assetId: String(form.get('assetId') || ''), notes: String(form.get('notes') || '') };
    setBusy(true); setError(''); try { await save([...debts.filter(d => d.id !== row.id), row]); setEditing(null); } catch { setError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'); } finally { setBusy(false); }
  }
  async function remove(id: string) { setBusy(true); setError(''); try { await save(debts.filter(d => d.id !== id)); setDeleteId(''); } catch { setError('ลบไม่สำเร็จ กรุณาลองอีกครั้ง'); } finally { setBusy(false); } }
  const current = editing && editing !== 'new' ? editing : null;
  return <section className="panel debt-registry" aria-labelledby="debts-title">
    <div className="debt-header"><div><h2 id="debts-title">หนี้สินและภาระคงค้าง</h2><p className="muted">บันทึกเพื่อเตรียมข้อมูลแยกจากทรัพย์สิน การระบุหนี้ไม่ได้ยืนยันสิทธิในการหักภาษี</p></div><button type="button" className="btn btn-secondary" onClick={() => { setEditing('new'); setError(''); }}>เพิ่มหนี้สิน</button></div>
    {debts.length ? <div className="debt-list">{debts.map(d => <div className="debt-row" key={d.id}><div><strong>{d.creditor}</strong><p className="muted">{kinds[d.kind] || 'อื่น ๆ'} · {new Intl.NumberFormat('th-TH').format(d.amount)} บาท {d.asOf && `· ณ ${d.asOf}`}</p>{d.assetId && <p className="muted">หลักประกัน: {assets.find(a => a.id === d.assetId)?.name || 'ไม่พบรายการทรัพย์สิน'}</p>}</div><div className="wp-actions">{deleteId === d.id ? <><span>ลบรายการนี้?</span><button type="button" className="btn btn-small" onClick={() => setDeleteId('')}>ยกเลิก</button><button type="button" className="btn btn-small danger" disabled={busy} onClick={() => void remove(d.id)}>ยืนยันลบ</button></> : <><button type="button" className="btn btn-small" onClick={() => { setEditing(d); setError(''); }}>แก้ไข</button><button type="button" className="btn btn-small danger" onClick={() => setDeleteId(d.id)}>ลบ</button></>}</div></div>)}</div> : <p className="muted debt-empty">ยังไม่มีรายการหนี้สิน</p>}
    {editing && <form className="stack debt-form" key={current?.id || 'new'} onSubmit={submit}>
      <h3>{current ? 'แก้ไขหนี้สิน' : 'เพิ่มหนี้สิน'}</h3><div className="form-grid">
        <label className="field">ชื่อเจ้าหนี้<input name="creditor" required maxLength={200} defaultValue={current?.creditor} /></label>
        <label className="field">ประเภท<select name="kind" defaultValue={current?.kind || 'loan'}>{Object.entries(kinds).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label className="field">ยอดคงเหลือ (บาท)<input name="amount" type="number" min="0" max="100000000000000" step="any" required defaultValue={current?.amount} /></label>
        <label className="field">ยอด ณ วันที่<input name="asOf" type="date" defaultValue={current?.asOf} /></label>
        <label className="field">มีหลักประกันหรือไม่<select name="security" defaultValue={current?.security || 'unknown'}><option value="unknown">ไม่แน่ใจ</option><option value="yes">มี</option><option value="no">ไม่มี</option></select></label>
        <label className="field">ทรัพย์สินที่เกี่ยวข้อง (ถ้ามี)<select name="assetId" defaultValue={current?.assetId || ''}><option value="">ยังไม่ระบุ</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      </div><label className="field">หมายเหตุ<textarea name="notes" maxLength={1000} defaultValue={current?.notes} /></label><p className="muted">หากบันทึกหนี้เดียวกันไว้กับทรัพย์สินแล้ว โปรดระวังไม่นับซ้ำ</p><div className="wp-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกหนี้สิน'}</button><button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setError(''); }}>ยกเลิก</button></div>
    </form>}{error && <p role="alert">{error}</p>}
  </section>;
}
