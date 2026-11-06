"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  LoaderCircle,
  FlaskConical,
  FolderHeart,
  FileText,
  Users,
} from "lucide-react";
import { Brand, TreeArt } from "./brand";
import "./auth-experience.css";
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [mockFilled, setMockFilled] = useState(false),
    [values, setValues] = useState({
      name: "",
      email: "",
      password: "",
      consent: false,
      role: "OWNER",
      ownsAssets: "yes",
      nominate: "yes",
      goal: "เตรียมข้อมูลให้ครอบครัว",
    });
  const update = (key: string, value: string | boolean) => {
    setValues((v) => ({ ...v, [key]: value }));
    setMockFilled(false);
  };
  const mockLogin =
    !register &&
    mockFilled &&
    values.email === "somchai@example.test" &&
    values.password === "YooTor-demo-2026";
  function fillMockAccount() {
    setValues({
      name: "สมชาย ใจดี",
      email: register
        ? `somchai-demo-${crypto.randomUUID()}@example.test`
        : "somchai@example.test",
      password: "YooTor-demo-2026",
      consent: false,
      role: "OWNER",
      ownsAssets: "yes",
      nominate: "yes",
      goal: "เตรียมข้อมูลให้ครอบครัว",
    });
    setError("");
    setShow(false);
    setMockFilled(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (register && step === 0) {
      setStep(1);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mockLogin
            ? { action: "demo", role: "OWNER" }
            : {
                ...values,
                action: register ? "register" : "login",
              },
        ),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "ไม่สามารถเข้าสู่ระบบได้");
      if (register)
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: values.name, consent: values.consent }),
        });
      router.push(values.role === "FAMILY" ? "/app/family" : "/app");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo", role: "OWNER" }),
      });
      if (!res.ok) throw new Error("เริ่มทดลองไม่ได้ กรุณาลองอีกครั้ง");
      router.push("/app");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div
      className={`auth-page auth-experience ${register ? "auth-register" : "auth-login"}`}
    >
      <aside className="auth-story">
        <div className="auth-story-top">
          <Link href="/" aria-label="อยู่ต่อ หน้าแรก">
            <Brand light={register} />
          </Link>
        </div>
        <div className="auth-story-copy">
          <span className="auth-eyebrow">PERSONAL LEGACY WORKSPACE</span>
          <h2>
            {register ? "เริ่มเตรียมวันนี้" : "กลับมาดูแล"}
            <br />
            {register ? "เพื่อคนสำคัญของคุณ" : "เรื่องสำคัญของคุณ"}
          </h2>
          <p>
            {register
              ? "สร้างพื้นที่ส่วนตัวสำหรับข้อมูลสำคัญ"
              : "เติมข้อมูลที่ยังขาด"}
            <br />
            {register
              ? "ที่ครอบครัวอาจต้องใช้ในวันข้างหน้า"
              : "แล้วค่อย ๆ เตรียมต่อในจังหวะของคุณ"}
          </p>
          <div className="auth-visual">
            <TreeArt />
          </div>
          <div className="auth-workspace-caption"><span /> พื้นที่เตรียมข้อมูลของคุณ</div>
            <ul className="auth-preparation">
              <li>
                <FolderHeart size={18} />
                <span>ทรัพย์สินและกรมธรรม์<small>รวบรวมข้อมูลสำคัญไว้เป็นระบบ</small></span>
              </li>
              <li>
                <FileText size={18} />
                <span>เอกสารและความตั้งใจ<small>เตรียมสิ่งที่อยากส่งต่อให้ชัดเจน</small></span>
              </li>
              <li>
                <Users size={18} />
                <span>คนที่คุณไว้วางใจ<small>กำหนดผู้เข้าถึงข้อมูลที่คุณเลือก</small></span>
              </li>
            </ul>
        </div>
        <p className="auth-tagline">เพราะความห่วงใย ไม่ได้จบลงที่การจากลา</p>
      </aside>
      <main className="auth-main">
        <Link href="/" className="text-link auth-back">
          <ArrowLeft size={16} />
          กลับหน้าแรก
        </Link>
        <div className="auth-box">
          <Brand />
          <div className="auth-form-eyebrow">{register ? "CREATE YOUR WORKSPACE" : "WELCOME TO YOUR WORKSPACE"}</div>
          <h1>
            {register ? "สร้างบัญชีอยู่ต่อ" : "ยินดีต้อนรับกลับมา"}
          </h1>
          <p className="muted">
            {register
              ? "พื้นที่ส่วนตัวสำหรับเตรียมเรื่องสำคัญให้คนที่คุณรัก"
              : "เข้าสู่พื้นที่ของคุณ แล้วค่อย ๆ เตรียมไปด้วยกัน"}
          </p>
          {register && (
            <div
              className={`onboarding-progress auth-step-${step}`}
              aria-label="ขั้นตอนสมัครสมาชิก"
            >
              <span
                className={step === 0 ? "selected" : "done"}
                aria-current={step === 0 ? "step" : undefined}
              >
                {step > 0 ? <Check size={14} /> : "1"} บัญชีของคุณ
              </span>
              <i />
              <span
                className={step === 1 ? "selected" : ""}
                aria-current={step === 1 ? "step" : undefined}
              >
                2 สิ่งที่อยากเตรียม
              </span>
            </div>
          )}
          <form onSubmit={submit} className={`stack auth-form-step-${step}`}>
            {register && step === 0 && (
              <label className="field">
                ชื่อและนามสกุล
                <input
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="ชื่อที่ต้องการให้เราเรียก"
                  maxLength={120}
                />
              </label>
            )}
            {(!register || step === 0) && (
              <>
                <label className="field">
                  อีเมล
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={values.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="field">
                  รหัสผ่าน
                  <div className="password-input">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete={
                        register ? "new-password" : "current-password"
                      }
                      required
                      minLength={register ? 10 : 1}
                      value={values.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder={
                        register ? "อย่างน้อย 10 ตัวอักษร" : "กรอกรหัสผ่าน"
                      }
                    />
                    <button
                      type="button"
                      aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </>
            )}
            {register && step === 1 && (
              <>
                <label className="field">
                  คุณต้องการใช้งานในบทบาทใด
                  <select
                    value={values.role}
                    onChange={(e) => update("role", e.target.value)}
                  >
                    <option value="OWNER">เตรียมข้อมูลของฉันให้ครอบครัว</option>
                    <option value="FAMILY">
                      สมาชิกครอบครัวที่ได้รับอนุญาต
                    </option>
                  </select>
                </label>
                <label className="field">
                  มีทรัพย์สินที่ต้องการจัดระเบียบหรือไม่
                  <select
                    value={values.ownsAssets}
                    onChange={(e) => update("ownsAssets", e.target.value)}
                  >
                    <option value="yes">มี และอยากเริ่มรวบรวมข้อมูล</option>
                    <option value="later">ยังไม่แน่ใจ จะเพิ่มภายหลัง</option>
                  </select>
                </label>
                <label className="field">
                  ต้องการระบุบุคคลที่ไว้วางใจหรือไม่
                  <select
                    value={values.nominate}
                    onChange={(e) => update("nominate", e.target.value)}
                  >
                    <option value="yes">ต้องการเพิ่มคนสำคัญ</option>
                    <option value="later">ขอเตรียมข้อมูลก่อน</option>
                  </select>
                </label>
                <label className="field">
                  เป้าหมายของคุณ
                  <select
                    value={values.goal}
                    onChange={(e) => update("goal", e.target.value)}
                  >
                    <option>เตรียมข้อมูลให้ครอบครัว</option>
                    <option>จัดระเบียบทรัพย์สินและเอกสาร</option>
                    <option>ทำความเข้าใจขั้นตอนต่าง ๆ</option>
                  </select>
                </label>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={values.consent}
                    required
                    onChange={(e) => update("consent", e.target.checked)}
                  />
                  <span>
                    ฉันยินยอมให้จัดเก็บข้อมูลเพื่อให้บริการ และได้อ่าน{" "}
                    <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link> แล้ว
                  </span>
                </label>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary full-width" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={18} /> : null}
              {busy
                ? "กำลังดำเนินการ…"
                : register
                  ? step === 0
                    ? "ถัดไป"
                    : "สร้างบัญชีและเริ่มวางแผน"
                  : mockLogin
                    ? "เข้าสู่ระบบตัวอย่าง"
                    : "เข้าสู่ระบบ"}
              <ArrowRight size={17} />
            </button>
            {register && step === 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(0)}
              >
                ย้อนกลับ
              </button>
            )}
          </form>
          {(!register || step === 0) && (
            <div className="auth-mock-panel">
              <div>
                <FlaskConical size={17} />
                <span>ลองกรอกด้วยบัญชีสมมติ</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={busy}
                onClick={fillMockAccount}
              >
                กรอกข้อมูลตัวอย่าง
              </button>
              <p aria-live="polite">
                {mockFilled
                  ? register
                    ? "กรอกข้อมูลตัวอย่างแล้ว คุณแก้ไขและกดถัดไปได้ โดยยังต้องยืนยันความยินยอมด้วยตนเอง"
                    : "กรอกข้อมูลแล้ว กดเข้าสู่ระบบตัวอย่างเพื่อเปิดบัญชีทดลองของคุณสมชาย"
                  : "เติมข้อมูลให้โดยอัตโนมัติ เพื่อทดลองขั้นตอนด้วยตัวคุณเอง"}
              </p>
            </div>
          )}
          <div className="auth-divider">
            <span>หรือสำรวจก่อนเริ่มต้น</span>
          </div>
          <button
            disabled={busy}
            className="btn btn-secondary full-width"
            onClick={() => void demo()}
          >
            ทดลองใช้งานด้วยข้อมูลสมมติ
          </button>
          <p className="auth-switch">
            {register ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </Link>
          </p>
          <div className="auth-security">
            <ShieldCheck size={16} />
            ไม่ต้องใช้ข้อมูลธนาคารหรือเลขบัตรประชาชน
          </div>
        </div>
      </main>
    </div>
  );
}
