"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  FolderHeart,
  Users,
  HeartHandshake,
  Check,
  FileText,
  LockKeyhole,
  Plus,
  Heart,
  Menu,
  X,
  LoaderCircle,
} from "lucide-react";
import { Brand, TreeArt } from "./brand";
import "./landing.css";
export function Landing({ signedIn = false }: { signedIn?: boolean }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [menu, setMenu] = useState(false);
  const landingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    landingRef.current
      ?.querySelectorAll(
        ".journey-section, .features-section, .preview-section, .privacy-section, .faq-section, .landing-cta",
      )
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  async function demo() {
    if (signedIn) {
      // A full navigation avoids reusing a prefetched anonymous page after auth changes.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/app');
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo", role: "OWNER" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถเริ่มทดลองได้");
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Clear the anonymous router cache after signing in.
      window.location.assign('/app');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div
      ref={landingRef}
      className="landing motion-on"
    >
      <header
        className="landing-header"
        onKeyDown={(event) => {
          if (event.key === "Escape") setMenu(false);
        }}
      >
        <Link href="/" aria-label="อยู่ต่อ หน้าแรก">
          <Brand />
        </Link>
        <nav
          id="landing-nav"
          aria-label="เมนูหลัก"
          className={menu ? "open" : ""}
        >
          <a href="#how" onClick={() => setMenu(false)}>
            อยู่ต่อช่วยอย่างไร
          </a>
          <a href="#features" onClick={() => setMenu(false)}>
            สิ่งที่คุณเตรียมได้
          </a>
          <a href="#privacy" onClick={() => setMenu(false)}>
            ความเป็นส่วนตัว
          </a>
          <a href="#faq" onClick={() => setMenu(false)}>
            คำถามที่พบบ่อย
          </a>
        </nav>
        <div className="landing-header-actions">
          {!signedIn && <Link className="login-link" href="/login" prefetch={false}>
            เข้าสู่ระบบ
          </Link>}
          <Link className="btn btn-primary" href={signedIn ? '/app' : '/register'} prefetch={false}>
            {signedIn ? 'เข้าสู่พื้นที่ของคุณ' : 'เริ่มวางแผน'} <ArrowUpRight size={16} />
          </Link>
          <button
            className="btn mobile-menu"
            aria-label={menu ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={menu}
            aria-controls="landing-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <h1>
              <span className="hero-line">เตรียมภาษีและมรดก</span>
              <span className="hero-line">ให้คนข้างหลัง</span>
              <span className="hero-line hero-accent">
                ไม่ต้องเริ่มจากศูนย์
              </span>
            </h1>
            <p className="hero-description">
              รวบรวมทรัพย์สินและกรมธรรม์ ร่างพินัยกรรม
              <br className="desktop-break" />
              พร้อมแนวทางเตรียมภาษีของเจ้ามรดกในพื้นที่เดียว
            </p>
            <p className="hero-moving-copy">
              <span>เริ่มจาก</span>
              <span className="word-cycle" aria-hidden="true">
                <span>ทรัพย์สินที่คุณมี</span>
                <span>กรมธรรม์ที่เก็บไว้</span>
                <span>ความตั้งใจถึงคนสำคัญ</span>
              </span>
              <span className="motion-copy-accessible">
                ทรัพย์สินที่คุณมี กรมธรรม์ที่เก็บไว้ หรือความตั้งใจถึงคนสำคัญ
              </span>
            </p>
            <div className="hero-buttons">
              <Link className="btn btn-primary" href={signedIn ? '/app' : '/register'} prefetch={false}>
                {signedIn ? 'เข้าสู่พื้นที่ของคุณ' : 'เริ่มวางแผน'} <ArrowRight size={18} />
              </Link>
              {!signedIn && <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => void demo()}
              >
                {busy ? <LoaderCircle className="spin" size={17} /> : null}
                ทดลองใช้งานระบบ <ArrowUpRight size={17} />
              </button>}
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <p className="hero-privacy">
              <ShieldCheck size={15} />
              พื้นที่ส่วนตัวของคุณ เลือกได้ว่าใครเข้าถึงข้อมูลใด
            </p>
          </div>
          <div className="hero-art">
            <TreeArt />
            <div className="hero-note">
              <Heart size={19} />
              <p>
                เพราะความห่วงใย
                <br />
                <strong>ไม่ได้จบลงที่การจากลา</strong>
              </p>
            </div>
            <div className="floating-document">
              <span className="icon-box">
                <FolderHeart size={24} />
              </span>
              <div>
                <strong>เรื่องสำคัญ รวมไว้ที่เดียว</strong>
                <span>ภาษี · กรมธรรม์ · พินัยกรรม</span>
              </div>
              <span className="floating-check">
                <Check size={14} />
              </span>
            </div>
          </div>
        </section>
        <section className="journey-section" id="how">
          <div className="section-intro">
            <h2>
              หนึ่งความห่วงใย
              <br />
              ดูแลได้ทั้งสองช่วงเวลา
            </h2>
            <p>
              ไม่ว่าจะกำลังเตรียมไว้ล่วงหน้า
              <br />
              หรือช่วยคนที่รักดูแลสิ่งที่เหลืออยู่
            </p>
          </div>
          <div className="journey-item">
            <div className="journey-icon">
              <FolderHeart size={27} />
            </div>
            <h3>เตรียมให้พร้อม ในวันที่ยังอยู่</h3>
            <p>
              รวบรวมทรัพย์สิน จัดเก็บเอกสาร และบอกความตั้งใจ
              <br />
              ให้ทุกเรื่องสำคัญมีที่อยู่ที่คนข้างหลังหาเจอ
            </p>
            <Link href={signedIn ? '/app' : '/register'} prefetch={false}>
              {signedIn ? 'กลับสู่พื้นที่ของคุณ' : 'เริ่มเตรียมข้อมูลของคุณ'} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="journey-item">
            <div className="journey-icon gold">
              <HeartHandshake size={27} />
            </div>
            <h3>ช่วยครอบครัว ให้ก้าวต่อได้</h3>
            <p>
              เข้าถึงเฉพาะข้อมูลที่ได้รับอนุญาต พร้อมรายการ
              <br />
              ขั้นตอนและเอกสาร ช่วยให้รู้ว่าควรเริ่มจากตรงไหน
            </p>
            <Link href={signedIn ? '/app/family' : '/login'} prefetch={false}>
              พื้นที่สำหรับครอบครัว <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <section className="features-section" id="features">
          <div className="section-heading">
            <h2>เตรียมเรื่องสำคัญ ให้ง่ายขึ้นทีละนิด</h2>
            <p>ไม่จำเป็นต้องพร้อมทุกอย่างในวันเดียว เริ่มจากสิ่งที่คุณมี</p>
          </div>
          <div className="feature-list">
            {[
              {
                icon: FolderHeart,
                title: "รวบรวมกรมธรรม์ประกันชีวิต",
                text: "บันทึกเลขกรมธรรม์ บริษัทประกัน ผู้รับประโยชน์ และเอกสารประกอบ เพื่อเตรียมติดต่อเรียกร้องสิทธิ",
              },
              {
                icon: Users,
                title: "เตรียมภาษีของเจ้ามรดก",
                text: "แยกภาษีปีที่เสียชีวิต กองมรดกที่ยังไม่ได้แบ่ง และภาษีผู้รับมรดก พร้อมติดตามเอกสาร",
              },
              {
                icon: FileText,
                title: "เขียนพินัยกรรมฉบับร่าง",
                text: "ช่วยร่างการจัดสรรทรัพย์สิน ระบุผู้รับและผู้จัดการมรดก บันทึกและดาวน์โหลดเพื่อทบทวนก่อนลงนาม",
              },
              {
                icon: HeartHandshake,
                title: "ผู้ช่วยค่อย ๆ อธิบายเรื่องยาก",
                text: "คำอธิบายภาษาไทย พร้อมแหล่งข้อมูลทางการ เพื่อใช้เตรียมคำถามให้ผู้เชี่ยวชาญ",
              },
            ].map((f) => (
              <article key={f.title}>
                <f.icon size={28} strokeWidth={1.5} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="preview-section">
          <div className="preview-copy">
            <h2>
              เห็นภาพความพร้อม
              <br />
              ดูแลต่อได้อย่างมั่นใจ
            </h2>
            <p>
              มองเห็นข้อมูลที่เตรียมแล้ว และสิ่งที่ยังต้องเติม
              <br />
              ในพื้นที่ที่ออกแบบให้สบายใจตั้งแต่ครั้งแรกที่ใช้
            </p>
            <button
              onClick={() => void demo()}
              disabled={busy}
              className="text-link"
            >
              {signedIn ? 'กลับสู่พื้นที่ของคุณ' : 'ลองสำรวจพื้นที่ของคุณ'} <ArrowRight size={17} />
            </button>
          </div>
          <div className="mini-dashboard">
            <div className="mini-top">
              <Brand />
              <span>พื้นที่ของคุณสมชาย · ข้อมูลสมมติ</span>
            </div>
            <h3>ความพร้อมในการส่งต่อ</h3>
            <div className="mini-progress">
              <strong>
                80<span>%</span>
              </strong>
              <div>
                <div className="progress">
                  <i style={{ width: "80%" }} />
                </div>
                <p>เริ่มต้นวันนี้ ค่อย ๆ เตรียมให้ครบ</p>
              </div>
            </div>
            <div className="mini-rows">
              {[
                "บันทึกรายการทรัพย์สิน",
                "ระบุบุคคลที่ไว้วางใจ",
                "จัดเก็บเอกสารสำคัญ",
              ].map((s) => (
                <div key={s}>
                  <span className="check-icon">
                    <Check size={11} />
                  </span>
                  {s}
                  <span>เรียบร้อยแล้ว</span>
                </div>
              ))}
            </div>
            <small>คะแนนการจัดระเบียบข้อมูล ไม่ใช่การประเมินทางกฎหมาย</small>
          </div>
        </section>
        <section className="privacy-section" id="privacy">
          <LockKeyhole size={31} strokeWidth={1.4} />
          <div>
            <h2>ข้อมูลสำคัญ ต้องอยู่ในมือคุณ</h2>
            <p>
              เก็บข้อมูลและเอกสารเป็นส่วนตัว ตรวจสอบสิทธิ์ก่อนเข้าถึง
              และบันทึกการใช้งาน
              <br />
              คำขอของครอบครัวต้องได้รับการพิจารณา
              การแจ้งเสียชีวิตไม่เปิดข้อมูลโดยอัตโนมัติ
            </p>
            <Link href="/privacy" className="text-link">
              อ่านเรื่องความเป็นส่วนตัว <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <section className="faq-section" id="faq">
          <div>
            <h2>เรื่องที่คุณอาจสงสัย</h2>
            <p>ค่อย ๆ ทำความเข้าใจ ก่อนเริ่มต้น</p>
          </div>
          <div className="faq-list">
            {[
              [
                "อยู่ต่อเป็นบริการจัดทำพินัยกรรมหรือไม่?",
                "อยู่ต่อช่วยเขียน บันทึก และดาวน์โหลดพินัยกรรมฉบับร่างได้ คุณต้องทบทวนข้อความและลงนามตามแบบที่กฎหมายกำหนดก่อนนำไปใช้ การกดบันทึกในระบบยังไม่ใช่การลงนามพินัยกรรม",
              ],
              [
                "ครอบครัวจะเห็นข้อมูลของฉันทันทีหรือไม่?",
                "ไม่เห็นโดยอัตโนมัติ ต้องเป็นผู้ติดต่อที่คุณระบุไว้ มีสิทธิ์ในหมวดข้อมูลนั้น และได้รับการอนุมัติคำขอ การอัปโหลดมรณบัตรไม่ทำให้ระบบเปิดข้อมูล",
              ],
              [
                "ต้องเตรียมข้อมูลทั้งหมดให้ครบก่อนหรือเปล่า?",
                "เริ่มจากข้อมูลเพียงหนึ่งรายการได้ แล้วกลับมาเติมรายละเอียด เอกสาร และคนที่ไว้วางใจเมื่อพร้อม",
              ],
              [
                "ทดลองใช้งานได้อย่างไร?",
                "กดทดลองใช้งานระบบเพื่อสำรวจข้อมูลสมมติของคุณสมชาย สลับมุมมองครอบครัวเพื่อทดลองขอสิทธิ์ และกลับเป็นเจ้าของเพื่อพิจารณาคำขอได้ โดยไม่ใช้ข้อมูลจริง",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <Heart size={27} strokeWidth={1.4} />
          <h2>ให้ความห่วงใยของคุณ อยู่ต่อ</h2>
          <p>เริ่มเตรียมวันนี้ เพื่อวันข้างหน้าของคนที่คุณรัก</p>
          <Link href={signedIn ? '/app' : '/register'} prefetch={false} className="btn btn-primary">
            {signedIn ? 'เข้าสู่พื้นที่ของคุณ' : 'เริ่มวางแผน'} <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>เพราะความห่วงใย ไม่ได้จบลงที่การจากลา</p>
        <Link href="/privacy">ความเป็นส่วนตัว</Link>
        <span>© 2026 YooTor</span>
        <small>
          ข้อมูลเพื่อช่วยเตรียมความพร้อม
          ไม่ใช่คำปรึกษาทางกฎหมายหรือภาษีเฉพาะบุคคล
        </small>
      </footer>
    </div>
  );
}
