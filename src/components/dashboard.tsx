'use client';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  Circle,
  Home,
  Landmark,
  ShieldCheck,
  Car,
  FileText,
  Users,
  FolderHeart,
  Heart,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { TreeArt } from './brand';
const categoryNames: Record<string, string> = {
  property: 'อสังหาริมทรัพย์',
  bank: 'บัญชีธนาคาร',
  insurance: 'กรมธรรม์ประกันชีวิต',
  vehicle: 'ยานพาหนะ',
  investment: 'การลงทุน',
  business: 'ธุรกิจ',
  other: 'ทรัพย์สินอื่น',
};
const categoryIcons: Record<string, typeof Home> = {
  property: Home,
  bank: Landmark,
  insurance: ShieldCheck,
  vehicle: Car,
};
export const baht = (n: number) =>
  new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n);
export function Dashboard({ state }: { state: any }) {
  const {
    assets = [],
    documents = [],
    contacts = [],
    instructions = [],
    profile = {},
    activities = [],
  } = state;
  const checks = [
    {
      label: 'ข้อมูลส่วนตัว',
      done: !!profile.name || !!state.user.name,
      href: 'settings',
    },
    {
      label: 'บันทึกทรัพย์สิน',
      done:
        assets.length > 0 && assets.every((a: any) => a.status === 'complete'),
      href: 'assets',
    },
    {
      label: 'บุคคลที่ไว้วางใจ',
      done: contacts.some(
        (c: any) => c.kind === 'trusted' && c.status === 'active',
      ),
      href: 'contacts',
    },
    {
      label: 'จัดเก็บเอกสารสำคัญ',
      done: documents.length > 0,
      href: 'documents',
    },
    {
      label: 'บันทึกความประสงค์',
      done: instructions.length > 0,
      href: 'instructions',
    },
  ];
  const score = checks.filter((c) => c.done).length * 20;
  const tasks = [
    {
      title: 'ตรวจสอบเอกสารของทรัพย์สิน',
      text: 'แนบเอกสารอ้างอิงให้ข้อมูลพร้อมขึ้น',
      href: 'documents',
      icon: FileText,
    },
    {
      title: 'บันทึกสิ่งที่อยากส่งต่อ',
      text: 'ฝากข้อความหรือความประสงค์ให้ครอบครัว',
      href: 'instructions',
      icon: Heart,
    },
    {
      title: 'ทบทวนสิทธิ์ของคนสำคัญ',
      text: 'เลือกข้อมูลที่คุณต้องการให้เข้าถึง',
      href: 'contacts',
      icon: Users,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="date-line">พื้นที่เตรียมความพร้อมของคุณ</div>
          <h1>
            สวัสดี {state.user.name?.startsWith('คุณ') ? '' : 'คุณ'}
            {state.user.name?.split(' ')[0]}{' '}
            <span className="greeting-sun">☀</span>
          </h1>
          <p className="muted">
            ทุกสิ่งที่เตรียมวันนี้ คือความห่วงใยที่ส่งต่อถึงคนที่คุณรัก
          </p>
        </div>
        <Link className="btn btn-primary" href="/app/assets?new=1">
          <Plus size={18} />
          เพิ่มทรัพย์สิน
        </Link>
      </div>
      <div className="overview-top">
        <section className="panel readiness-panel">
          <div className="panel-head">
            <h2>ความพร้อมในการส่งต่อ</h2>
            <span className="tag tag-success">ค่อย ๆ เตรียมไปด้วยกัน</span>
          </div>
          <div className="readiness-body">
            <div className="readiness-ring">
              <svg viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  fill="none"
                  stroke="#edf1ef"
                  strokeWidth="10"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  fill="none"
                  stroke="#2f8c88"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${score * 4.084} 408.4`}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div>
                <strong>
                  {score}
                  <span>%</span>
                </strong>
                <small>ความพร้อมของคุณ</small>
              </div>
            </div>
            <div className="readiness-list">
              {checks.map((c) => (
                <Link href={`/app/${c.href}`} key={c.label}>
                  <span className={c.done ? 'check-icon' : 'unchecked'}>
                    {c.done ? <Check size={12} /> : <Circle size={16} />}
                  </span>
                  <span>{c.label}</span>
                  <ChevronRight size={14} />
                </Link>
              ))}
            </div>
          </div>
          <p className="metric-note">
            คะแนนการจัดระเบียบข้อมูลของอยู่ต่อ ไม่ใช่การประเมินทางกฎหมาย
          </p>
        </section>
        <section className="care-panel">
          <div>
            <span className="care-mark">
              <Heart size={17} />
            </span>
            <h2>
              เตรียมวันนี้
              <br />
              ให้ความห่วงใยอยู่ต่อ
            </h2>
            <p>
              เริ่มทีละนิด เพื่อให้วันข้างหน้า
              <br />
              ของคนที่คุณรักง่ายขึ้น
            </p>
            <Link href="/app/instructions">
              บันทึกความตั้งใจของคุณ <ArrowRight size={16} />
            </Link>
          </div>
          <TreeArt />
        </section>
      </div>
      <div className="stats-grid">
        <Link className="panel stat" href="/app/assets">
          <span className="stat-icon">
            <Landmark size={22} />
          </span>
          <div>
            <p>มูลค่าทรัพย์สินที่บันทึก</p>
            <strong>
              ฿{' '}
              {baht(
                assets.reduce(
                  (n: number, a: any) => n + Number(a.value || 0),
                  0,
                ),
              )}
            </strong>
            <small>จากทรัพย์สิน {assets.length} รายการ · มูลค่าโดยประมาณ</small>
          </div>
          <ArrowUpRight size={16} />
        </Link>
        <Link className="panel stat" href="/app/documents">
          <span className="stat-icon blue">
            <FileText size={22} />
          </span>
          <div>
            <p>เอกสารสำคัญ</p>
            <strong>
              {documents.length} <span>รายการ</span>
            </strong>
            <small>จัดเก็บไว้สำหรับวันที่จำเป็น</small>
          </div>
          <ArrowUpRight size={16} />
        </Link>
        <Link className="panel stat" href="/app/contacts">
          <span className="stat-icon gold">
            <Users size={22} />
          </span>
          <div>
            <p>บุคคลที่ไว้วางใจ</p>
            <strong>
              {contacts.filter((c: any) => c.kind === 'trusted').length}{' '}
              <span>คน</span>
            </strong>
            <small>คนสำคัญที่คุณเลือกให้ช่วยดูแล</small>
          </div>
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="overview-bottom">
        <section className="panel asset-preview">
          <div className="panel-head">
            <h2>
              ทรัพย์สินของคุณ <span className="count">{assets.length}</span>
            </h2>
            <Link href="/app/assets" className="text-link">
              ดูทั้งหมด <ArrowRight size={15} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>รายการทรัพย์สิน</th>
                  <th>มูลค่าโดยประมาณ</th>
                  <th>ข้อมูล</th>
                </tr>
              </thead>
              <tbody>
                {assets.slice(0, 5).map((a: any) => {
                  const Icon = categoryIcons[a.category] || FolderHeart;
                  return (
                    <tr key={a.id}>
                      <td>
                        <Link href="/app/assets" className="asset-cell">
                          <span className={`asset-icon ${a.category}`}>
                            <Icon size={20} />
                          </span>
                          <span>
                            <strong>{a.name}</strong>
                            <small>
                              {categoryNames[a.category] || 'อื่น ๆ'}
                            </small>
                          </span>
                        </Link>
                      </td>
                      <td className="amount">฿ {baht(Number(a.value || 0))}</td>
                      <td>
                        <span
                          className={`status-inline ${a.status === 'complete' ? 'complete' : ''}`}
                        >
                          {a.status === 'complete' ? 'ครบถ้วน' : 'รอข้อมูล'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {assets.length === 0 && (
              <div className="empty">
                <FolderHeart />
                <h3>เริ่มบันทึกทรัพย์สินชิ้นแรก</h3>
                <Link className="text-link" href="/app/assets">
                  เพิ่มทรัพย์สิน <Plus size={16} />
                </Link>
              </div>
            )}
          </div>
          <div className="panel-foot">
            <ShieldCheck size={14} />
            <span>ข้อมูลส่วนตัว แสดงเฉพาะคุณและผู้ที่ได้รับอนุญาต</span>
          </div>
        </section>
        <section className="panel next-actions">
          <div className="panel-head">
            <h2>ก้าวต่อไปของคุณ</h2>
            <span className="step-icon">
              <ArrowUpRight size={17} />
            </span>
          </div>
          <p className="muted next-intro">
            เติมรายละเอียดเล็ก ๆ ให้ความพร้อมสมบูรณ์ขึ้น
          </p>
          {tasks.map((t) => (
            <Link href={`/app/${t.href}`} className="next-action" key={t.title}>
              <span className="action-square">
                <t.icon size={18} />
              </span>
              <span>
                <strong>{t.title}</strong>
                <small>{t.text}</small>
              </span>
              <ChevronRight size={16} />
            </Link>
          ))}
          <Link className="checklist-link" href="/app/checklist">
            ดูรายการเตรียมความพร้อมทั้งหมด <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <section className="panel activity-panel">
        <div className="panel-head">
          <h2>ความเคลื่อนไหวล่าสุด</h2>
          <Link href="/app/settings" className="text-link">
            ประวัติการใช้งาน <ArrowRight size={15} />
          </Link>
        </div>
        <div className="activity-list">
          {activities.slice(0, 3).map((a: any, i: number) => (
            <div className="activity-item" key={a.id || i}>
              <span className="activity-icon">
                <Clock size={15} />
              </span>
              <span>{a.description || a.message || a.action}</span>
              <time>
                {a.createdAt
                  ? new Intl.DateTimeFormat('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Bangkok',
                    }).format(new Date(a.createdAt))
                  : 'วันนี้'}
              </time>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="muted">
              กิจกรรมของคุณจะแสดงที่นี่เมื่อเริ่มบันทึกข้อมูล
            </p>
          )}
        </div>
      </section>
    </>
  );
}
