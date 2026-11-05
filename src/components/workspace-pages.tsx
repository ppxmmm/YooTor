'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from 'react';
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  FileText,
  Upload,
  ShieldCheck,
  ArrowUpRight,
  Send,
  Check,
  Download,
  Users,
  Landmark,
  Info,
} from 'lucide-react';
import './workspace-pages.css';
import { InsuranceBuilder } from './insurance-builder';
import { WillBuilder } from './will-builder';
import { DocumentPreview } from './pdf-preview';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = {
  section: string;
  state: any;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
};
type Row = Record<string, any>;
const categories: Record<string, string> = {
  property: 'อสังหาริมทรัพย์',
  bank: 'บัญชีธนาคาร',
  insurance: 'ประกันชีวิต',
  investment: 'การลงทุน',
  vehicle: 'ยานพาหนะ',
  business: 'ธุรกิจ',
  other: 'อื่น ๆ',
};
const statuses: Record<string, string> = {
  not_started: 'ยังไม่เริ่ม',
  in_progress: 'กำลังดำเนินการ',
  waiting: 'รอเอกสาร',
  completed: 'เสร็จแล้ว',
  pending: 'รอพิจารณา',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  verification_pending: 'รอยืนยันตัวตน',
  manual_review: 'ตรวจสอบโดยเจ้าหน้าที่',
};
const money = (n: any) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
async function api(path: string, method: string, body?: any) {
  const res = await fetch(`/api/${path}`, {
    method,
    headers:
      body instanceof FormData
        ? undefined
        : { 'Content-Type': 'application/json' },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง',
    );
  return data;
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="modal wp-dialog"
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      aria-label={title}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="btn btn-small" onClick={close} aria-label="ปิด">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Field({
  label,
  name,
  defaultValue = '',
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: any;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <FileText size={30} />
      <h3>{text}</h3>
      <p className="muted">
        เริ่มเพิ่มข้อมูล เพื่อให้คนสำคัญของคุณดูแลเรื่องต่อไปได้ง่ายขึ้น
      </p>
    </div>
  );
}
function Heading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
export function WorkspacePages(props: Props) {
  return <Page key={props.section} {...props} />;
}
function Page({ section, state, refresh, notify }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('all'),
    [preview, setPreview] = useState<{
      url: string;
      name: string;
      mime: string;
      id: string;
    } | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  useEffect(() => {
    if (
      section === 'assets' &&
      new URLSearchParams(window.location.search).get('new') === '1'
    )
      setEditing({});
  }, [section]);
  const previewDoc = async (doc: Row) => {
    if (doc.mime === 'application/pdf') {
      setPreview({
        url: `/api/documents/${doc.id}`,
        name: doc.name,
        mime: doc.mime,
        id: doc.id,
      });
      return;
    }
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (!res.ok) throw new Error('ไม่สามารถเปิดเอกสารได้');
      const blob = await res.blob();
      setPreview({
        url: URL.createObjectURL(blob),
        name: doc.name,
        mime: blob.type,
        id: doc.id,
      });
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const mutate = async (path: string, method: string, body: any) => {
    setBusy(true);
    try {
      const result = await api(path, method, body);
      await refresh();
      notify('บันทึกข้อมูลเรียบร้อยแล้ว');
      return result;
    } catch (e) {
      notify((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  };
  const remove = (path: string, id: string) => {
    if (window.confirm('ต้องการลบรายการนี้ใช่ไหม?'))
      void mutate(path, 'DELETE', { id }).catch(() => {});
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const body: Row = { ...values };
    if (editing?.id) body.id = editing.id;
    if (section === 'assets') body.value = Number(body.value);
    if (section === 'contacts')
      body.permissions = new FormData(e.currentTarget).getAll('permissions');
    try {
      await mutate(section, editing?.id ? 'PATCH' : 'POST', body);
      setEditing(null);
    } catch {
      /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
    }
  };
  if (
    section === 'assets' ||
    section === 'contacts' ||
    section === 'instructions'
  ) {
    const isAsset = section === 'assets',
      isContact = section === 'contacts';
    const title = isAsset
      ? 'ทรัพย์สินของฉัน'
      : isContact
        ? 'คนสำคัญของฉัน'
        : 'พินัยกรรมและความประสงค์';
    const rows = (state[section] || []).filter(
      (x: Row) =>
        (!isAsset || category === 'all' || x.category === category) &&
        `${x.name || x.title} ${x.reference || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <>
        <Heading
          title={title}
          description={
            isAsset
              ? 'รวบรวมข้อมูลสำคัญไว้ในที่เดียว เพื่อวันที่คนข้างหลังต้องใช้'
              : isContact
                ? 'คนที่คุณไว้วางใจ และคนที่คุณอยากดูแล'
                : 'เขียนพินัยกรรม จัดสรรทรัพย์สิน และบอกความประสงค์ให้คนที่รัก'
          }
        >
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            <Plus size={18} />
            เพิ่ม
            {isAsset ? 'ทรัพย์สิน' : isContact ? 'ผู้ติดต่อ' : 'ความตั้งใจ'}
          </button>
        </Heading>
        {section === 'instructions' && (
          <div className="notice">
            <Info size={18} />
            <span>
              ข้อมูลในส่วนนี้เป็นบันทึกความประสงค์ส่วนบุคคล
              ไม่ใช่พินัยกรรมที่มีผลสมบูรณ์ตามกฎหมายโดยอัตโนมัติ
            </span>
          </div>
        )}
        {section === 'instructions' && (
          <WillBuilder
            notify={notify}
            save={(content) =>
              mutate('instructions', 'POST', {
                title: 'พินัยกรรมฉบับร่าง',
                category: 'will',
                content,
                status: 'draft',
              })
            }
          />
        )}
        {isContact && (
          <div className="notice">
            <Info size={18} />
            <span>
              บุคคลที่ไว้วางใจเข้าถึงเฉพาะข้อมูลที่อนุญาต
              ผู้รับประโยชน์เป็นบันทึกเพื่อวางแผน
              ไม่ก่อให้เกิดสิทธิ์รับมรดกตามกฎหมาย
              และการบันทึกชื่อผู้จัดการมรดกไม่ได้เป็นการแต่งตั้งตามกฎหมาย
            </span>
          </div>
        )}
        {isAsset && (
          <InsuranceBuilder save={(data) => mutate('assets', 'POST', data)} />
        )}
        {isAsset && (
          <div className="wp-summary panel">
            <div className="icon-box">
              <Landmark />
            </div>
            <div>
              <span className="muted">มูลค่าทรัพย์สินที่บันทึก</span>
              <h2>
                {money(
                  (state.assets || []).reduce(
                    (sum: number, x: Row) => sum + Number(x.value || 0),
                    0,
                  ),
                )}
              </h2>
            </div>
            <span className="tag">{(state.assets || []).length} รายการ</span>
          </div>
        )}
        <div className="panel">
          <div className="toolbar">
            <label className="search">
              <Search size={17} />
              <input
                aria-label="ค้นหารายการ"
                placeholder="ค้นหาชื่อหรือรายละเอียด…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {isAsset && (
              <select
                className="wp-filter"
                aria-label="กรองประเภททรัพย์สิน"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">ทุกประเภท</option>
                {Object.entries(categories).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            )}
            <span className="muted">{rows.length} รายการ</span>
          </div>
          {rows.length === 0 ? (
            <Empty text="ยังไม่มีรายการ" />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{isContact ? 'ชื่อ / ความสัมพันธ์' : 'รายการ'}</th>
                    <th>
                      {isAsset
                        ? 'ประเภท'
                        : isContact
                          ? 'ข้อมูลติดต่อ'
                          : 'รายละเอียด'}
                    </th>
                    <th>
                      {isAsset
                        ? 'มูลค่าโดยประมาณ'
                        : isContact
                          ? 'สิทธิ์เข้าถึง'
                          : ''}
                    </th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x: Row) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.name || x.title}</strong>
                        {isContact && (
                          <small className="wp-sub">
                            {{
                              trusted: 'บุคคลที่ไว้วางใจ',
                              beneficiary: 'ผู้รับประโยชน์',
                              administrator: 'ผู้จัดการมรดก',
                            }[x.kind as string] || x.kind}{' '}
                            ·{' '}
                            {{
                              pending: 'รอการยืนยัน',
                              active: 'ยืนยันผู้ติดต่อแล้ว',
                              revoked: 'ถอนสิทธิ์แล้ว',
                            }[x.status as string] || 'รอการยืนยัน'}
                          </small>
                        )}
                        <small className="wp-sub">
                          {isAsset
                            ? x.reference
                            : isContact
                              ? x.relationship
                              : 'ความตั้งใจของคุณ'}
                        </small>
                      </td>
                      <td>
                        {isAsset ? (
                          categories[x.category] || x.category
                        ) : isContact ? (
                          <>
                            <span>{x.email || '—'}</span>
                            <small className="wp-sub">{x.phone}</small>
                          </>
                        ) : (
                          <span className="wp-preview">{x.content}</span>
                        )}
                      </td>
                      <td>
                        {isAsset ? (
                          money(x.value)
                        ) : isContact ? (
                          <span className="tag">
                            {(x.permissions || []).length} หมวดข้อมูล
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <div className="wp-actions">
                          <button
                            className="btn btn-small"
                            aria-label={`แก้ไข ${x.name || x.title}`}
                            onClick={() => setEditing(x)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn btn-small danger"
                            aria-label={`ลบ ${x.name || x.title}`}
                            onClick={() => remove(section, x.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {editing && (
          <Modal
            title={`${editing.id ? 'แก้ไข' : 'เพิ่ม'}${isAsset ? 'ทรัพย์สิน' : isContact ? 'ผู้ติดต่อ' : 'ความตั้งใจ'}`}
            close={() => setEditing(null)}
          >
            <form className="stack" onSubmit={submit}>
              {isAsset ? (
                <>
                  <Field
                    label="ชื่อทรัพย์สิน"
                    name="name"
                    defaultValue={editing.name}
                    required
                  />
                  <div className="form-grid">
                    <label className="field">
                      ประเภท
                      <select
                        name="category"
                        defaultValue={editing.category || 'property'}
                      >
                        {Object.entries(categories).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="มูลค่าโดยประมาณ (บาท)"
                      name="value"
                      type="number"
                      defaultValue={editing.value || 0}
                    />
                  </div>
                  <Field
                    label="เลขอ้างอิง / ที่ตั้ง"
                    name="reference"
                    defaultValue={editing.reference}
                  />
                  <label className="field">
                    สถานะข้อมูล
                    <select
                      name="status"
                      defaultValue={editing.status || 'incomplete'}
                    >
                      <option value="incomplete">ยังไม่ครบถ้วน</option>
                      <option value="complete">ครบถ้วน</option>
                    </select>
                  </label>
                  <label className="field">
                    หมายเหตุ
                    <textarea name="notes" defaultValue={editing.notes} />
                  </label>
                </>
              ) : isContact ? (
                <>
                  <Field
                    label="ชื่อและนามสกุล"
                    name="name"
                    defaultValue={editing.name}
                    required
                  />
                  <Field
                    label="ความสัมพันธ์"
                    name="relationship"
                    defaultValue={editing.relationship}
                    required
                  />
                  <div className="form-grid">
                    <Field
                      label="อีเมล"
                      type="email"
                      name="email"
                      defaultValue={editing.email}
                    />
                    <Field
                      label="เบอร์โทรศัพท์"
                      type="tel"
                      name="phone"
                      defaultValue={editing.phone}
                    />
                  </div>
                  <label className="field">
                    บทบาท
                    <select
                      name="kind"
                      defaultValue={editing.kind || 'trusted'}
                    >
                      <option value="trusted">บุคคลที่ไว้วางใจ</option>
                      <option value="beneficiary">ผู้รับประโยชน์</option>
                      <option value="administrator">ผู้จัดการมรดก</option>
                    </select>
                  </label>
                  <label className="field">
                    สถานะผู้ติดต่อ
                    <select
                      name="status"
                      defaultValue={editing.status || 'pending'}
                    >
                      <option value="pending">รอการยืนยัน</option>
                      <option value="active">ยืนยันผู้ติดต่อแล้ว</option>
                      <option value="revoked">ถอนสิทธิ์แล้ว</option>
                    </select>
                  </label>
                  <fieldset className="wp-permissions">
                    <legend>หมวดข้อมูลที่อนุญาต</legend>
                    {[
                      ['assets', 'ทรัพย์สิน'],
                      ['documents', 'เอกสาร'],
                      ['instructions', 'ความตั้งใจ'],
                    ].map(([k, v]) => (
                      <label key={k}>
                        <input
                          type="checkbox"
                          name="permissions"
                          value={k}
                          defaultChecked={(editing.permissions || []).includes(
                            k,
                          )}
                        />
                        {v}
                      </label>
                    ))}
                  </fieldset>
                  <p className="muted">
                    การระบุสิทธิ์ไม่ใช่การให้เข้าถึงทันที
                    ยังต้องผ่านการตรวจสอบคำขอ
                  </p>
                </>
              ) : (
                <>
                  <Field
                    label="หัวข้อความตั้งใจ"
                    name="title"
                    defaultValue={editing.title}
                    required
                  />
                  <label className="field">
                    ข้อความถึงคนสำคัญ
                    <textarea
                      rows={7}
                      name="content"
                      defaultValue={editing.content}
                      required
                      placeholder="สิ่งที่อยากบอก สิ่งที่อยากให้ช่วยดูแล…"
                    />
                  </label>
                </>
              )}
              <button disabled={busy} className="btn btn-primary">
                {busy ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}
              </button>
            </form>
          </Modal>
        )}
      </>
    );
  }
  if (section === 'documents')
    return (
      <>
        <Heading
          title="เอกสารสำคัญ"
          description="เก็บสำเนาและข้อมูลอ้างอิงที่ครอบครัวอาจต้องใช้"
        >
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            <Upload size={18} />
            อัปโหลดเอกสาร
          </button>
        </Heading>
        <div className="notice">
          <ShieldCheck size={20} />
          <span>
            เอกสารจะเข้าถึงได้ตามสิทธิ์ที่ได้รับอนุญาต
            เก็บต้นฉบับไว้ในสถานที่ปลอดภัยด้วยเสมอ
          </span>
        </div>
        <div className="wp-docs">
          {(state.documents || []).map((d: Row) => (
            <article className="panel wp-doc" key={d.id}>
              <div className="icon-box">
                <FileText />
              </div>
              <h3>{d.name}</h3>
              <p className="muted">
                {d.category || 'เอกสารทั่วไป'} ·{' '}
                {d.size ? `${Math.ceil(d.size / 1024)} KB · ` : ''}
                {d.createdAt
                  ? new Date(d.createdAt).toLocaleDateString('th-TH')
                  : ''}
                <br />
                {d.originalName || d.fileName || d.filename || 'ไฟล์แนบ'}
              </p>
              <span className="tag tag-success">จัดเก็บแล้ว</span>
              <div className="wp-actions">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => void previewDoc(d)}
                >
                  ดูเอกสาร
                </button>
                <a
                  className="btn btn-secondary btn-small"
                  href={`/api/documents/${d.id}`}
                  download
                >
                  <Download size={15} />
                  ดาวน์โหลด
                </a>
                <button
                  className="btn btn-small danger"
                  aria-label={`ลบ ${d.name}`}
                  onClick={() => remove('documents', d.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {!state.documents?.length && (
          <div className="panel">
            <Empty text="ยังไม่มีเอกสารสำคัญ" />
          </div>
        )}
        {preview && (
          <Modal title={preview.name} close={() => setPreview(null)}>
            <DocumentPreview
              url={preview.url}
              mime={preview.mime}
              name={preview.name}
            />
            <a
              className="btn btn-secondary full-width"
              href={`/api/documents/${preview.id}`}
              download
            >
              <Download size={16} />
              ดาวน์โหลดเอกสารต้นฉบับ
            </a>
          </Modal>
        )}
        {editing && (
          <Modal title="อัปโหลดเอกสาร" close={() => setEditing(null)}>
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                try {
                  await mutate('documents', 'POST', data);
                  setEditing(null);
                } catch {
                  /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
                }
              }}
            >
              <Field name="name" label="ชื่อเอกสาร" required />
              <label className="field">
                หมวดหมู่
                <select name="category">
                  <option>เอกสารส่วนตัว</option>
                  <option>ทรัพย์สิน</option>
                  <option>ประกันชีวิต</option>
                  <option>พินัยกรรม</option>
                  <option>อื่น ๆ</option>
                </select>
              </label>
              <label className="field">
                เลือกไฟล์ (PDF หรือรูปภาพ)
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                />
              </label>
              <button disabled={busy} className="btn btn-primary">
                {busy ? 'กำลังอัปโหลด…' : 'อัปโหลดเอกสาร'}
              </button>
            </form>
          </Modal>
        )}
      </>
    );
  if (section === 'checklist')
    return (
      <>
        <Heading
          title="สิ่งที่ต้องดำเนินการ"
          description="ค่อย ๆ เตรียมทีละเรื่อง พร้อมข้อมูลและขั้นตอนที่ชัดเจน"
        />
        <div className="panel wp-task-progress">
          <strong>
            ดำเนินการแล้ว{' '}
            {
              (state.tasks || []).filter((x: Row) => x.status === 'completed')
                .length
            }{' '}
            จาก {(state.tasks || []).length} เรื่อง
          </strong>
          <progress
            className="progress"
            max={Math.max(state.tasks?.length || 0, 1)}
            value={
              (state.tasks || []).filter((x: Row) => x.status === 'completed')
                .length
            }
          />
        </div>
        <div className="stack">
          {(state.tasks || []).map((task: Row) => (
            <details className="panel wp-task" key={task.id}>
              <summary>
                <span
                  className={`wp-check ${task.status === 'completed' ? 'done' : ''}`}
                >
                  {task.status === 'completed' ? <Check size={16} /> : null}
                </span>
                <span>
                  <strong>{task.title}</strong>
                  <small className="wp-sub">
                    {task.agency || 'การเตรียมข้อมูลของคุณ'}
                  </small>
                </span>
                <span className="tag">
                  {statuses[task.status] || task.status}
                </span>
              </summary>
              <div className="wp-task-body stack">
                <p>{task.description}</p>
                {task.conditions && (
                  <p>
                    <strong>เงื่อนไข: </strong>
                    {task.conditions}
                  </p>
                )}
                {task.requiredDocuments && (
                  <p>
                    <strong>เอกสารที่ใช้: </strong>
                    {Array.isArray(task.requiredDocuments)
                      ? task.requiredDocuments.join(', ')
                      : task.requiredDocuments}
                  </p>
                )}
                {task.nextAction && (
                  <div className="notice">ขั้นตอนถัดไป: {task.nextAction}</div>
                )}
                {task.source && (
                  <a
                    href={
                      typeof task.source === 'string' &&
                      task.source.startsWith('https://')
                        ? task.source
                        : 'https://www.rd.go.th/548.html'
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    ตรวจสอบข้อมูลจากหน่วยงาน <ArrowUpRight size={14} />
                  </a>
                )}
                <form
                  className="stack"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await mutate('tasks', 'PATCH', {
                        id: task.id,
                        ...Object.fromEntries(new FormData(e.currentTarget)),
                      });
                    } catch {
                      /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
                    }
                  }}
                >
                  <label className="field">
                    สถานะ
                    <select name="status" defaultValue={task.status}>
                      {[
                        'not_started',
                        'in_progress',
                        'waiting',
                        'completed',
                      ].map((s) => (
                        <option value={s} key={s}>
                          {statuses[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    บันทึกเพิ่มเติม
                    <textarea name="notes" defaultValue={task.notes} />
                  </label>
                  <button className="btn btn-secondary" disabled={busy}>
                    บันทึกความคืบหน้า
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      </>
    );
  if (section === 'assistant') return <Assistant />;
  if (section === 'tax') return <Tax userId={state.user?.id || 'guest'} />;
  if (section === 'family')
    return <Family state={state} busy={busy} mutate={mutate} />;
  if (section === 'settings')
    return (
      <>
        <Heading
          title="ตั้งค่าบัญชี"
          description="จัดการข้อมูลส่วนตัว และดูแลข้อมูลของคุณ"
        />
        <div className="panel">
          <h2>ข้อมูลส่วนตัว</h2>
          <form
            className="stack wp-settings-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate(
                  'profile',
                  'PATCH',
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
              } catch {
                /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
              }
            }}
          >
            <Field
              label="ชื่อและนามสกุล"
              name="name"
              defaultValue={state.profile?.name || state.user?.name}
              required
            />
            <Field
              label="เบอร์โทรศัพท์"
              name="phone"
              type="tel"
              defaultValue={state.profile?.phone}
            />
            <p className="muted">อีเมลบัญชี: {state.user?.email}</p>
            <button className="btn btn-primary" disabled={busy}>
              บันทึกการเปลี่ยนแปลง
            </button>
          </form>
        </div>
        <div className="panel wp-settings-section">
          <h2>การเข้าสู่ระบบและประวัติกิจกรรม</h2>
          <p className="muted">
            คุณกำลังใช้เซสชันที่ยืนยันตัวตนด้วยคุกกี้ของบัญชีนี้
            ระบบยังไม่รองรับการจัดการเซสชันอุปกรณ์อื่นจากหน้านี้
          </p>
          <h3>กิจกรรมล่าสุด</h3>
          {(state.activities || []).slice(0, 8).map((activity: Row) => (
            <div className="wp-request" key={activity.id}>
              <span>
                {activity.message || activity.title || activity.action}
              </span>
              <small className="muted">
                {activity.createdAt
                  ? new Date(activity.createdAt).toLocaleString('th-TH')
                  : ''}
              </small>
            </div>
          ))}
          {!state.activities?.length && (
            <p className="muted">ยังไม่มีกิจกรรมที่บันทึกไว้</p>
          )}
        </div>
        <div className="panel wp-settings-section">
          <h2>ข้อมูลของคุณ</h2>
          <p className="muted">
            ดาวน์โหลดข้อมูลทั้งหมดในรูปแบบ JSON เพื่อเก็บสำเนาส่วนตัว
          </p>
          <a className="btn btn-secondary" href="/api/export" download>
            <Download size={17} />
            ส่งออกข้อมูล
          </a>
        </div>
        <div className="panel wp-settings-section">
          <h2>ลบบัญชี</h2>
          <p className="muted">
            ข้อมูลที่บันทึกทั้งหมดจะถูกลบถาวร และไม่สามารถกู้คืนได้
          </p>
          <button
            className="btn btn-secondary danger"
            onClick={() => setEditing({})}
          >
            ลบบัญชีและข้อมูล
          </button>
        </div>
        {editing && (
          <Modal title="ยืนยันการลบบัญชี" close={() => setEditing(null)}>
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                if (new FormData(e.currentTarget).get('confirm') !== 'ลบบัญชี')
                  return;
                try {
                  await api('account', 'DELETE');
                  router.replace('/');
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              <p>การดำเนินการนี้จะลบข้อมูลถาวร พิมพ์ “ลบบัญชี” เพื่อยืนยัน</p>
              <Field label="ยืนยันการลบ" name="confirm" required />
              <button className="btn btn-primary danger">
                ลบข้อมูลอย่างถาวร
              </button>
            </form>
          </Modal>
        )}
      </>
    );
  return null;
}

function Family({
  state,
  busy,
  mutate,
}: {
  state: any;
  busy: boolean;
  mutate: (path: string, method: string, body: any) => Promise<any>;
}) {
  const [selected, setSelected] = useState<Row | null>(null);
  return (
    <>
      <Heading
        title="พื้นที่ครอบครัว"
        description="เชื่อมต่อคนที่ไว้วางใจ ด้วยการเข้าถึงที่คุณควบคุมได้"
      />
      <div className="notice">
        <ShieldCheck size={20} />
        <span>
          คำขอทุกครั้งต้องได้รับการตรวจสอบ
          ไม่มีการเปิดข้อมูลอัตโนมัติจากเอกสารการเสียชีวิต
          {state.user?.demo
            ? 'โหมดสาธิต: ขั้นตอนนี้จำลองการตรวจสอบ ไม่ใช่การยืนยันสิทธิ์ทางกฎหมาย'
            : 'ผู้ขอต้องเป็นผู้ติดต่อที่เจ้าของยืนยันแล้ว และต้องได้รับอนุมัติสิทธิ์อย่างชัดเจน'}
        </span>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h2>ขอเข้าถึงข้อมูลของคนในครอบครัว</h2>
          <Users size={22} />
        </div>
        <form
          className="wp-request-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            try {
              await mutate(
                'requests',
                'POST',
                Object.fromEntries(new FormData(form)),
              );
              form.reset();
            } catch {
              /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
            }
          }}
        >
          <Field
            label="อีเมลเจ้าของข้อมูล"
            type="email"
            name="ownerEmail"
            required
          />
          <button className="btn btn-primary" disabled={busy}>
            ส่งคำขอเข้าถึง
          </button>
        </form>
      </div>
      <div className="panel wp-settings-section">
        <h2>คำขอและสถานะการเข้าถึง</h2>
        {!state.requests?.length ? (
          <p className="muted">ยังไม่มีคำขอเข้าถึงข้อมูล</p>
        ) : (
          <div className="stack">
            {state.requests.map((r: Row) => (
              <div className="wp-request" key={r.id}>
                <div>
                  <strong>
                    {r.requesterEmail ||
                      r.email ||
                      r.ownerEmail ||
                      'คำขอเข้าถึงข้อมูล'}
                  </strong>
                  <p className="muted">
                    {r.ownerEmail && `เจ้าของข้อมูล: ${r.ownerEmail}`}
                  </p>
                  <span className="tag">{statuses[r.status] || r.status}</span>
                  {r.status === 'approved' && (
                    <p>
                      อนุญาตเฉพาะ:{' '}
                      {(r.permissions || [])
                        .map(
                          (p: string) =>
                            ({
                              assets: 'ทรัพย์สิน',
                              documents: 'เอกสาร',
                              instructions: 'ความตั้งใจ',
                            })[p] || p,
                        )
                        .join(', ') || 'ไม่มีหมวดข้อมูล'}
                    </p>
                  )}
                  {r.sharedData && (
                    <details>
                      <summary>ดูข้อมูลที่ได้รับอนุญาต</summary>
                      <pre className="wp-shared">
                        {JSON.stringify(r.sharedData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                {(state.user?.role === 'OWNER' ||
                  r.ownerId === state.user?.id ||
                  r.ownerEmail === state.user?.email) && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelected(r)}
                  >
                    ตรวจสอบคำขอ
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {state.user?.role !== 'OWNER' &&
        (state.requests || []).some((r: Row) => r.status === 'approved') && (
          <div className="panel wp-settings-section">
            <h2>ข้อมูลที่ได้รับอนุญาต</h2>
            <p className="muted">แสดงเฉพาะหมวดที่เจ้าของข้อมูลอนุมัติ</p>
            {(state.assets || []).map((a: Row) => (
              <div className="wp-request" key={a.id}>
                <strong>{a.name}</strong>
                <span>
                  {categories[a.category]} · {money(a.value)}
                </span>
              </div>
            ))}
            {(state.documents || []).map((d: Row) => (
              <div className="wp-request" key={d.id}>
                <strong>{d.name}</strong>
                <a
                  className="btn btn-small btn-secondary"
                  href={`/api/documents/${d.id}`}
                  download
                >
                  ดาวน์โหลด
                </a>
              </div>
            ))}
            {(state.instructions || []).map((i: Row) => (
              <article key={i.id}>
                <h3>{i.title}</h3>
                <p className="wp-preview">{i.content}</p>
              </article>
            ))}
          </div>
        )}
      {selected && (
        <Modal title="ตรวจสอบคำขอเข้าถึง" close={() => setSelected(null)}>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                await mutate('requests', 'PATCH', {
                  id: selected.id,
                  status: fd.get('status'),
                  permissions: fd.getAll('permissions'),
                });
                setSelected(null);
              } catch {
                /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
              }
            }}
          >
            <p>
              ผู้ขอ:{' '}
              {selected.requesterEmail || selected.email || 'บุคคลในครอบครัว'}
            </p>
            <label className="field">
              ผลการตรวจสอบ
              <select
                name="status"
                defaultValue={selected.status || 'verification_pending'}
              >
                <option value="verification_pending">
                  ขอยืนยันตัวตนเพิ่มเติม
                </option>
                <option value="manual_review">ส่งตรวจสอบโดยเจ้าหน้าที่</option>
                <option value="approved">อนุมัติสิทธิ์ตามหมวดที่เลือก</option>
                <option value="rejected">ไม่อนุมัติ</option>
              </select>
            </label>
            <fieldset className="wp-permissions">
              <legend>ขอบเขตข้อมูลที่อนุญาต</legend>
              {[
                ['assets', 'ทรัพย์สิน'],
                ['documents', 'เอกสาร'],
                ['instructions', 'ความตั้งใจ'],
              ].map(([k, v]) => (
                <label key={k}>
                  <input
                    type="checkbox"
                    name="permissions"
                    value={k}
                    defaultChecked={selected.permissions?.includes(k)}
                  />
                  {v}
                </label>
              ))}
            </fieldset>
            <p className="muted">
              โปรดตรวจสอบตัวตนและสิทธิ์ของผู้ขอ ก่อนอนุมัติทุกครั้ง
            </p>
            <button className="btn btn-primary" disabled={busy}>
              ยืนยันผลการตรวจสอบ
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Assistant() {
  const [messages, setMessages] = useState<
      { role: string; text: string; sources?: any[]; mode?: string }[]
    >([]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [includeContext, setIncludeContext] = useState(false);
  const send = async (message: string) => {
    if (!message.trim() || busy) return;
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const result = await api('assistant', 'POST', {
        message,
        includeContext,
      });
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: result.message,
          sources: result.sources,
          mode: result.mode,
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Heading
        title="ผู้ช่วยเตรียมความพร้อม"
        description="ช่วยจัดระเบียบสิ่งที่ต้องเตรียม และอธิบายขั้นตอนให้เข้าใจง่าย"
      />
      <div className="panel wp-chat">
        <p className="tag">
          ผู้ช่วยแบบคำแนะนำที่กำหนดไว้ · โหมดสาธิต ไม่ใช่ AI สด
        </p>
        <label className="wp-context">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => setIncludeContext(e.target.checked)}
          />
          ยินยอมให้ระบบใช้ข้อมูลในบัญชีที่ฉันมีสิทธิ์เข้าถึง
          เพื่อประกอบคำแนะนำครั้งนี้
        </label>
        <div className="notice">
          <Info size={19} />
          <span>
            ข้อมูลเพื่อการเตรียมตัวเบื้องต้น
            ไม่ใช่คำปรึกษากฎหมายหรือภาษีเฉพาะบุคคล
          </span>
        </div>
        {messages.length === 0 ? (
          <div className="wp-chat-welcome">
            <div className="icon-box">
              <ShieldCheck />
            </div>
            <h2>เริ่มจากเรื่องที่คุณกังวลได้เลย</h2>
            <p className="muted">
              เราช่วยคุณค่อย ๆ วางแผน ให้คนที่รักไปต่อได้อย่างมั่นใจ
            </p>
            <div className="wp-prompts">
              {[
                'เริ่มเตรียมข้อมูลมรดกอย่างไรดี',
                'เอกสารสำคัญที่ควรเตรียมมีอะไรบ้าง',
                'ผู้จัดการมรดกมีหน้าที่อะไร',
              ].map((q) => (
                <button
                  className="btn btn-secondary"
                  key={q}
                  onClick={() => void send(q)}
                >
                  {q}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="wp-messages" aria-live="polite">
            {messages.map((m, i) => (
              <article className={`wp-message ${m.role}`} key={i}>
                <small>
                  {m.role === 'user' ? 'คุณ' : 'ผู้ช่วยเตรียมความพร้อม'}
                </small>
                <p>{m.text}</p>
                {m.role === 'assistant' && (
                  <small>
                    โหมด: {m.mode || 'guided_mock'} ·
                    คำแนะนำตามแนวทางที่กำหนดไว้
                  </small>
                )}
                {m.sources?.map((s: any, j: number) => {
                  const url = typeof s === 'string' ? s : s.url;
                  return typeof url === 'string' &&
                    url.startsWith('https://') ? (
                    <a key={j} href={url} target="_blank" rel="noreferrer">
                      {s.title || 'แหล่งข้อมูลอ้างอิง'} ↗
                    </a>
                  ) : null;
                })}
              </article>
            ))}
            {busy && <p className="muted">กำลังเรียบเรียงคำตอบ…</p>}
          </div>
        )}
        {error && (
          <p role="alert" className="danger">
            {error} ส่งข้อความอีกครั้งเพื่อลองใหม่
          </p>
        )}
        <form
          className="wp-chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            aria-label="ข้อความถึงผู้ช่วย"
            placeholder="พิมพ์เรื่องที่อยากปรึกษา…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
          />
          <button
            className="btn btn-primary"
            disabled={busy || !input.trim()}
            aria-label="ส่งข้อความ"
          >
            <Send size={19} />
          </button>
        </form>
      </div>
    </>
  );
}
function Tax({ userId }: { userId: string }) {
  const [answer, setAnswer] = useState(''),
    [estate, setEstate] = useState(''),
    [checked, setChecked] = useState<Record<string, boolean>>({});
  const storageKey = `yootor-tax-${userId}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setAnswer(saved.answer || '');
      setEstate(saved.estate || '');
      setChecked(saved.checked || {});
    } catch {
      /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
    }
  }, [storageKey]);
  const saveTax = (
    nextAnswer: string,
    nextEstate: string,
    nextChecked: Record<string, boolean>,
  ) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answer: nextAnswer,
          estate: nextEstate,
          checked: nextChecked,
        }),
      );
    } catch {
      /* Mutation errors are reported by the shared mutation handler; local preferences are optional. */
    }
  };

  const primaryKeys = [
    'death-income',
    'tax-credit',
    'filing',
    'estate-income',
    'estate-id',
    'estate-return',
    'recipient',
    'policy',
    'inheritance-return',
  ];
  const completed = primaryKeys.filter((key) => checked[key]).length;
  return (
    <div className="tax-workspace">
      <Heading
        title="จัดการภาษีของเจ้ามรดก"
        description="แยกภาษีในปีที่เสียชีวิต ภาษีของกองมรดกที่ยังไม่ได้แบ่ง และภาษีของผู้รับมรดก พร้อมติดตามเอกสารที่ต้องเตรียม"
      />
      <div className="tax-overview">
        <div className="tax-overview-copy">
          <ShieldCheck size={22} />
          <div>
            <strong>ความพร้อมด้านเอกสารภาษี</strong>
            <p>ค่อย ๆ เตรียมข้อมูลให้ครบ ก่อนตรวจสอบและยื่นแบบ</p>
          </div>
        </div>
        <div className="tax-overview-progress">
          <span>
            <strong>{completed}</strong> / 9 รายการ
          </span>
          <progress
            aria-label="ความพร้อมด้านเอกสารภาษี"
            value={completed}
            max={9}
          />
          <small>บันทึกความคืบหน้าในอุปกรณ์นี้</small>
        </div>
      </div>
      <div className="notice tax-notice">
        <Info size={20} />
        <span>
          คำแนะนำทั่วไป ไม่ใช่การคำนวณภาษีหรือการวินิจฉัยหน้าที่ภาษี
          ตรวจสอบเงื่อนไขที่ใช้กับคุณกับกรมสรรพากรหรือผู้เชี่ยวชาญ
        </span>
      </div>
      <div className="tax-layout">
        <div className="tax-main">
          <section className="tax-plan">
            <div className="tax-section-heading">
              <h2>แผนจัดการภาษี 3 ส่วน</h2>
              <span>รายการเตรียมเอกสาร</span>
            </div>
            <p>
              อย่าใช้ยอดทรัพย์สินรวมแทนรายได้ที่ต้องยื่นภาษี
              แยกผู้มีหน้าที่และปีภาษีก่อนรวบรวมเอกสาร
            </p>
            {[
              [
                'ปีที่เจ้ามรดกเสียชีวิต',
                'ตรวจรายได้ของผู้ตายและกองมรดกตลอดปีที่เสียชีวิต ผู้จัดการมรดก ทายาท หรือผู้ครอบครองทรัพย์มรดกมีหน้าที่ดำเนินการแทนตามกรณี',
                [
                  [
                    'death-income',
                    'รวบรวมเงินเดือน ค่าเช่า ดอกเบี้ย และรายได้อื่นตลอดปีที่เสียชีวิต',
                  ],
                  [
                    'tax-credit',
                    'รวบรวมหนังสือรับรองหักภาษี ณ ที่จ่าย แบบเดิม และหลักฐานลดหย่อน',
                  ],
                  [
                    'filing',
                    'ยืนยันผู้ยื่นแทน แบบภาษี และวันครบกำหนดกับสรรพากร',
                  ],
                ],
              ],
              [
                'กองมรดกที่ยังไม่ได้แบ่งในปีถัดไป',
                'หากทรัพย์สินยังไม่ได้แบ่งและก่อให้เกิดเงินได้ ต้องตรวจหน้าที่ของกองมรดกแยกจากปีที่เสียชีวิต',
                [
                  [
                    'estate-income',
                    'แยกรายได้ ค่าใช้จ่าย และภาษีหัก ณ ที่จ่ายของกองมรดกตามปี',
                  ],
                  [
                    'estate-id',
                    'ตรวจเลขประจำตัวผู้เสียภาษีและผู้มีหน้าที่ดำเนินการแทน',
                  ],
                  [
                    'estate-return',
                    'ยืนยันแบบและกำหนดเวลายื่นของกองมรดกแต่ละปี',
                  ],
                ],
              ],
              [
                'ภาษีการรับมรดกของผู้รับแต่ละคน',
                'ตรวจประเภททรัพย์สิน มูลค่าที่ได้รับ ความสัมพันธ์ และข้อยกเว้นของผู้รับแต่ละราย แยกจากภาษีเงินได้ของเจ้ามรดก',
                [
                  [
                    'recipient',
                    'ทำรายการทรัพย์สิน มูลค่า และวันที่ได้รับ แยกตามผู้รับ',
                  ],
                  [
                    'policy',
                    'แยกเงินตามกรมธรรม์ ผู้รับประโยชน์ และเอกสารบริษัทประกันเพื่อให้ตรวจสถานะภาษี',
                  ],
                  [
                    'inheritance-return',
                    'ตรวจข้อยกเว้นและหน้าที่ยื่นภาษีการรับมรดกกับผู้เชี่ยวชาญ',
                  ],
                ],
              ],
            ].map(([title, description, tasks], index) => (
              <section className="tax-stage" key={String(title)}>
                <div className="tax-stage-heading">
                  <span className="tax-stage-number">{index + 1}</span>
                  <h3>{String(title)}</h3>
                  <span className="tax-stage-count">
                    {
                      (tasks as string[][]).filter(([key]) => checked[key])
                        .length
                    }{' '}
                    / 3
                  </span>
                </div>
                <p>{String(description)}</p>
                <fieldset className="wp-tax-checks tax-checklist">
                  <legend className="tax-sr-only">
                    {String(title)} — รายการเตรียมเอกสาร
                  </legend>
                  {(tasks as string[][]).map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={Boolean(checked[key])}
                        onChange={(e) => {
                          const next = { ...checked, [key]: e.target.checked };
                          setChecked(next);
                          saveTax(answer, estate, next);
                        }}
                      />
                      <span>{label}</span>
                      {checked[key] && <Check size={16} aria-hidden="true" />}
                    </label>
                  ))}
                </fieldset>
              </section>
            ))}
            <a
              href="https://www.rd.go.th/5937.html"
              target="_blank"
              rel="noreferrer"
            >
              ประมวลรัษฎากร มาตรา 57 ทวิ — หน้าที่เกี่ยวกับผู้ตายและกองมรดก
            </a>
          </section>
        </div>
        <aside className="tax-aside">
          <div className="panel stack tax-situation">
            <FileText size={22} aria-hidden="true" />
            <h2>เตรียมเอกสารตามสถานการณ์เพิ่มเติม</h2>
            <p className="tax-supporting">
              เลือกข้อมูลที่ตรงกับคุณ เพื่อดูสิ่งที่ควรรวบรวมเพิ่มเติม
            </p>
            <label className="field">
              เลือกสถานการณ์
              <select
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  saveTax(e.target.value, estate, checked);
                }}
              >
                <option value="">เลือกสถานการณ์</option>
                <option value="planning">กำลังวางแผนส่งต่อทรัพย์สิน</option>
                <option value="inherited">ได้รับทรัพย์สินมรดก</option>
                <option value="admin">กำลังดูแลทรัพย์สินของผู้เสียชีวิต</option>
              </select>
            </label>
            {answer && (
              <label className="field">
                ทรัพย์สินที่เกี่ยวข้อง
                <select
                  value={estate}
                  onChange={(e) => {
                    setEstate(e.target.value);
                    saveTax(answer, e.target.value, checked);
                  }}
                >
                  <option value="">เลือกประเภททรัพย์สิน</option>
                  <option value="property">ที่ดินหรืออสังหาริมทรัพย์</option>
                  <option value="financial">
                    เงินฝาก หลักทรัพย์ หรือเงินลงทุน
                  </option>
                  <option value="mixed">หลายประเภท / ยังไม่แน่ใจ</option>
                </select>
              </label>
            )}
            {answer && estate && (
              <div className="wp-tax-result">
                <fieldset className="wp-tax-checks">
                  <legend>รายการเตรียมตัวของคุณ (บันทึกในอุปกรณ์นี้)</legend>
                  {[
                    ['inventory', 'รวบรวมรายการทรัพย์สินและหลักฐานมูลค่า'],
                    ['identity', 'เตรียมหลักฐานความสัมพันธ์และตัวตน'],
                    [
                      answer === 'admin' ? 'income' : 'transfer',
                      answer === 'admin'
                        ? 'รวบรวมรายได้และเอกสารกองมรดก'
                        : 'รวบรวมเอกสารการได้มาและการส่งต่อ',
                    ],
                    ['consult', 'นัดตรวจสอบหน้าที่ภาษีกับผู้เชี่ยวชาญ'],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={Boolean(checked[key])}
                        onChange={(e) => {
                          const next = { ...checked, [key]: e.target.checked };
                          setChecked(next);
                          saveTax(answer, estate, next);
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <p className="muted">
                  กำหนดเวลาอ้างอิง: ยังไม่ได้ยืนยัน —
                  ต้องตรวจสอบตามกรณีกับหน่วยงานก่อนดำเนินการ
                </p>
                <div className="icon-box">
                  <Landmark />
                </div>
                <h3>
                  {answer === 'planning'
                    ? 'เริ่มจากบัญชีทรัพย์สินและวิธีการส่งต่อ'
                    : answer === 'inherited'
                      ? 'ตรวจสอบหน้าที่ภาษีการรับมรดก'
                      : 'รวบรวมข้อมูลรายได้และหน้าที่ของกองมรดก'}
                </h3>
                <p>
                  {answer === 'planning'
                    ? 'รวบรวมเจ้าของกรรมสิทธิ์ มูลค่าโดยประมาณ ผู้รับ และหลักฐานการได้มา การให้ระหว่างมีชีวิตและการรับมรดกอาจมีหลักเกณฑ์ต่างกัน'
                    : answer === 'inherited'
                      ? 'รวบรวมรายการทรัพย์สินที่ได้รับ หลักฐานมูลค่า ความสัมพันธ์กับเจ้ามรดก และวันที่ได้รับ เพื่อให้ผู้เชี่ยวชาญตรวจสอบข้อยกเว้นและหน้าที่ของผู้รับแต่ละราย'
                      : 'รวบรวมรายได้ก่อนและหลังการเสียชีวิต หลักฐานค่าใช้จ่าย และเอกสารแต่งตั้งผู้จัดการมรดก เพื่อสอบถามหน้าที่ยื่นแบบที่เกี่ยวข้อง'}
                </p>
                <p>
                  {estate === 'property'
                    ? 'สำหรับอสังหาริมทรัพย์ เตรียมโฉนด ราคาประเมิน และข้อมูลการจดทะเบียนไว้ด้วย'
                    : 'เตรียมรายการบัญชี รายการหลักทรัพย์ และหลักฐานยอด ณ วันที่เกี่ยวข้อง'}
                </p>
                <strong>ขั้นตอนถัดไป</strong>
                <p>
                  นำข้อมูลไปตรวจสอบกับกรมสรรพากรหรือที่ปรึกษาภาษี
                  ก่อนตัดสินใจและดำเนินการ
                </p>
              </div>
            )}
          </div>
          <div className="tax-resources">
            <h2>แหล่งข้อมูลทางการ</h2>
            <div className="wp-sources">
              <a
                href="https://www.rd.go.th/548.html"
                target="_blank"
                rel="noreferrer"
              >
                ภาษีเงินได้บุคคลธรรมดา <ArrowUpRight size={17} />
              </a>
              <a
                href="https://www.rd.go.th/56657.html"
                target="_blank"
                rel="noreferrer"
              >
                ข้อมูลภาษีการรับมรดก <ArrowUpRight size={17} />
              </a>
              <a
                href="https://www.rd.go.th/61303.html"
                target="_blank"
                rel="noreferrer"
              >
                ข้อมูลกรมสรรพากรเพิ่มเติม <ArrowUpRight size={17} />
              </a>
            </div>
            <p className="muted">
              ทบทวนแหล่งข้อมูล ณ วันที่ 5 พฤศจิกายน 2569 ·
              โปรดยืนยันหลักเกณฑ์ล่าสุดและการใช้กับกรณีของคุณ
            </p>
          </div>
          <div className="tax-next">
            <h3>จัดข้อมูลที่เกี่ยวข้องให้พร้อม</h3>
            <Link href="/app/assets">
              รวบรวมกรมธรรม์และทรัพย์สิน <ArrowUpRight size={16} />
            </Link>
            <Link href="/app/documents">
              จัดเก็บหลักฐานภาษี <ArrowUpRight size={16} />
            </Link>
            <Link href="/app/instructions">
              เขียนพินัยกรรม <ArrowUpRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
