'use client';
import Link from 'next/link';
import { allocationStatus, type PlanAsset, type PlanContact } from '@/lib/allocation';

export function AllocationOverview({ assets, contacts, edit }: { assets: PlanAsset[]; contacts: PlanContact[]; edit: (asset: PlanAsset) => void }) {
  const plannable = assets.filter(asset => asset.category !== 'insurance');
  const complete = plannable.filter(asset => allocationStatus(asset, contacts).complete).length;
  return <section className="panel allocation-overview" aria-labelledby="allocation-title">
    <div className="allocation-heading"><div><h2 id="allocation-title">แผนส่งต่อทรัพย์สิน</h2><p className="muted">เลือกผู้รับและสัดส่วนของทรัพย์สินแต่ละรายการ เพื่อเตรียมข้อมูลสำหรับฉบับร่าง</p></div><span className="tag">ระบุครบ {complete} จาก {plannable.length} รายการ</span></div>
    {!contacts.length && <p className="notice">เริ่มจาก <Link href="/app/contacts">เพิ่มบุคคลที่ต้องการส่งต่อให้</Link> แล้วกลับมาเลือกผู้รับ</p>}
    {!plannable.length ? <p className="muted">ยังไม่มีทรัพย์สินสำหรับจัดสรร เพิ่มทรัพย์สินเพื่อเริ่มต้น</p> : <div className="allocation-list">{plannable.map(asset => {
      const allocation = allocationStatus(asset, contacts);
      return <article className="allocation-row" key={asset.id}><div><h3>{asset.name}</h3><p className="muted">{allocation.status} · ระบุสัดส่วนรวม {allocation.total}%</p>{allocation.people.length > 0 && <ul>{allocation.people.map(person => <li key={person.id}>{person.name || 'ไม่พบชื่อผู้รับ'}: {person.share === undefined ? 'ยังไม่ระบุสัดส่วน' : `${person.share}%`}</li>)}</ul>}</div><button type="button" className="btn btn-secondary btn-small" onClick={() => edit(asset)}>จัดสรร {asset.name}</button></article>;
    })}</div>}
    {assets.some(asset => asset.category === 'insurance') && <p className="muted">กรมธรรม์แยกจากแผนนี้ เพราะผู้รับประโยชน์และการจัดประเภทต้องตรวจตามกรมธรรม์แต่ละฉบับ</p>}
    <p className="muted">ข้อมูลนี้เป็นความตั้งใจในการวางแผน ไม่ยืนยันกรรมสิทธิ์หรือสิทธิรับมรดก <Link href="/app/instructions">ไปเตรียมฉบับร่างพินัยกรรม →</Link></p>
  </section>;
}
