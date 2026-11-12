'use client';
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Layers,
  Users,
  FileText,
  PenLine,
  HeartHandshake,
  ListChecks,
  Sparkles,
  Scale,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  FlaskConical,
  ArrowRight,
  CircleHelp,
} from 'lucide-react';
import { Brand } from './brand';
import { navigationLabels } from '@/i18n/messages';
import { Dashboard } from './dashboard';
import { WorkspacePages } from './workspace-pages';
const nav = [
  { id: 'dashboard', name: navigationLabels.dashboard, icon: Home },
  { id: 'tax', name: navigationLabels.tax, icon: Scale },
  { id: 'assets', name: navigationLabels.assets, icon: Layers },
  { id: 'contacts', name: navigationLabels.contacts, icon: Users },
  { id: 'documents', name: navigationLabels.documents, icon: FileText },
  { id: 'instructions', name: navigationLabels.instructions, icon: PenLine },
  {
    id: 'family',
    name: navigationLabels.family,
    icon: HeartHandshake,
    group: true,
  },
  { id: 'checklist', name: navigationLabels.checklist, icon: ListChecks },
  { id: 'assistant', name: navigationLabels.assistant, icon: Sparkles },
];
export function Workspace({ section: initialSection, initialRole }: { section: string; initialRole: 'OWNER' | 'FAMILY' }) {
  const router = useRouter();
  const refreshSequence = useRef(0);
  const pathname = usePathname();
  const section = pathname === '/app' || pathname === '/app/'
    ? 'dashboard'
    : pathname?.startsWith('/app/') ? pathname.slice('/app/'.length) : initialSection;
  const [state, setState] = useState<any>(null),
    [error, setError] = useState(''),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState(''),
    [switching, setSwitching] = useState(false);
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (sequence !== refreshSequence.current) return;
    if (response.status === 401) {
      setState(null);
      router.replace('/login');
      return;
    }
    const body = await response.json();
    if (sequence !== refreshSequence.current) return;
    if (!response.ok) throw new Error(body.error || 'ไม่สามารถโหลดข้อมูลได้');
    setState(body);
  }, [router]);
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
    const revalidate = (event: PageTransitionEvent) => {
      if (event.persisted) void refresh().catch((e) => setError(e.message));
    };
    window.addEventListener('pageshow', revalidate);
    return () => window.removeEventListener('pageshow', revalidate);
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    setMobile(false);
  }, [section]);
  async function logout() {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      if (!response.ok) throw new Error('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
      window.location.replace('/');
    } catch {
      setToast('ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
    }
  }
  async function switchDemo() {
    setSwitching(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'demo',
          role: state.user.role === 'OWNER' ? 'FAMILY' : 'OWNER',
        }),
      });
      if (!res.ok) throw new Error('ไม่สามารถเปลี่ยนบัญชีได้');
      // Clear any pages prefetched under the previous role before navigating.
      window.location.replace('/app/family');
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSwitching(false);
    }
  }
  const family = (state?.user.role ?? initialRole) === 'FAMILY';
  function navigateWorkspace(event: MouseEvent<HTMLDivElement>) {
    if (!state || error || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        !(event.target instanceof Element)) return;
    const anchor = event.target.closest('a');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    const match = url.pathname.match(/^\/app(?:\/(assets|contacts|documents|instructions|family|checklist|assistant|tax|settings))?\/?$/);
    if (!match || (family && !['family', 'checklist', 'assistant', 'tax', 'settings'].includes(match[1] || 'dashboard'))) return;
    event.preventDefault();
    window.history.pushState(null, '', url.pathname + url.search + url.hash);
    void refresh().catch((e) => setError(e.message));
  }
  const current = nav.find((n) => n.id === section);
  const visible = family
    ? nav.filter((n) =>
        ['family', 'checklist', 'assistant', 'tax'].includes(n.id),
      )
    : nav;
  return (
    <div className="app-shell" onClickCapture={navigateWorkspace}>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="ปิดเมนู"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
        <Link href="/" className="sidebar-brand">
          <Brand light />
        </Link>
        <button
          className="mobile-close btn"
          onClick={() => setMobile(false)}
          aria-label="ปิดเมนู"
        >
          <X />
        </button>
        <div className="workspace-label">
          พื้นที่ของ{family ? 'ครอบครัว' : 'คุณ'}
        </div>
        <nav aria-label="เมนูหลัก">
          {visible.map((n) => (
            <Link
              key={n.id}
              href={`/app/${n.id === 'dashboard' ? '' : n.id}`}
              prefetch={false}
              className={`nav-item ${section === n.id ? 'active' : ''} ${n.group ? 'nav-group' : ''}`}
              aria-current={section === n.id ? 'page' : undefined}
            >
              <n.icon size={19} strokeWidth={1.65} />
              <span>{n.name}</span>
              {section === n.id && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-trust">
            <ShieldCheck size={20} />
            <p>
              ความห่วงใยของคุณ
              <br />
              <strong>อยู่ในพื้นที่ส่วนตัว</strong>
            </p>
          </div>
          <Link
            href="/app/settings"
            className={`nav-item ${section === 'settings' ? 'active' : ''}`}
          >
            <Settings size={19} />
            ตั้งค่าและความเป็นส่วนตัว
          </Link>
          <button onClick={() => void logout()} className="nav-item logout">
            <LogOut size={18} />
            ออกจากระบบ
          </button>
          <div className="sidebar-copyright">YooTor · ให้ความห่วงใยอยู่ต่อ</div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="btn mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={20} />
            </button>
            <Home size={16} />
            <span>/</span>
            <span>{current?.name || 'ตั้งค่า'}</span>
          </div>
          <div className="topbar-right">
            {state?.user.demo && (
              <span className="demo-tag">
                <FlaskConical size={14} />
                ข้อมูลสมมติ · โหมดทดลอง
              </span>
            )}
            <Link
              className="help-button"
              href="/app/assistant"
              aria-label="ความช่วยเหลือ"
            >
              <CircleHelp size={19} />
            </Link>
            <Link href="/app/settings" className="profile-button">
              <span className="avatar">
                {state?.user.name?.slice(0, 1) || 'ค'}
              </span>
              <span className="profile-name">
                {state?.user.name || 'กำลังโหลด…'}
                <small>{family ? 'สมาชิกครอบครัว' : 'บัญชีส่วนตัว'}</small>
              </span>
              <ChevronDown size={14} />
            </Link>
          </div>
        </header>
        <main className="workspace-content" id="main-content">
          {state?.user.demo && (
            <div className="demo-banner">
              <span>
                <FlaskConical size={15} />
                คุณกำลังทดลองใช้งานด้วยข้อมูลสมมติ
                ไม่มีการดำเนินการทางกฎหมายจริง
              </span>
              <button onClick={() => void switchDemo()} disabled={switching}>
                {switching
                  ? 'กำลังเปลี่ยน…'
                  : family
                    ? 'สลับเป็นเจ้าของข้อมูลเพื่อพิจารณาคำขอ'
                    : 'ทดลองมุมมองครอบครัว'}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          {error ? (
            <div className="panel empty">
              <h1>โหลดข้อมูลไม่สำเร็จ</h1>
              <p role="alert">{error}</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setError('');
                  void refresh().catch((e) => setError(e.message));
                }}
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : !state ? (
            <div className="skeleton-layout" aria-label="กำลังโหลดข้อมูล">
              <div />
              <div />
              <div />
            </div>
          ) : section === 'dashboard' && !family ? (
            <Dashboard state={state} />
          ) : (
            <div className="product-pages">
              <WorkspacePages
                section={
                  family &&
                  ![
                    'family',
                    'checklist',
                    'assistant',
                    'tax',
                    'settings',
                  ].includes(section)
                    ? 'family'
                    : section === 'dashboard'
                      ? 'family'
                      : section
                }
                state={state}
                refresh={refresh}
                notify={setToast}
              />
            </div>
          )}
          <footer className="workspace-footer">
            <span>
              <ShieldCheck size={14} />
              พื้นที่ส่วนตัวของคุณ · แบ่งปันเมื่อได้รับอนุญาต
            </span>
            <span>เพราะความห่วงใย ไม่ได้จบลงที่การจากลา</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <ShieldCheck size={18} />
          {toast}
          <button onClick={() => setToast('')} aria-label="ปิดข้อความ">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
