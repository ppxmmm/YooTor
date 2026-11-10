'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { emptyWillReview, type SavedWillReview } from '@/lib/will-review';
import { WillReviewPanel } from './will-review';

type Document = { id: string; name: string };
type Item = { id: string; name: string };
export type WillJourneyHandle = { openSavedReview: (review: SavedWillReview) => void };

function DiscardDialog({ cancel, discard }: { cancel: () => void; discard: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="modal wp-dialog will-discard-dialog" aria-labelledby="will-discard-title" onCancel={e => { e.preventDefault(); cancel(); }}>
    <h2 id="will-discard-title">มีคำตอบที่ยังไม่ได้บันทึก</h2>
    <p>หากดำเนินการต่อ การแก้ไขล่าสุดจะหายไป คุณสามารถกลับไปบันทึกก่อนได้</p>
    <div className="will-discard-actions"><button type="button" className="btn btn-secondary" autoFocus onClick={cancel}>กลับไปแก้ไข</button><button type="button" className="btn btn-primary" onClick={discard}>ละทิ้งการแก้ไข</button></div>
  </dialog>;
}

export function WillJourney({ documents, assets, contacts, saveReview, addNote, ref }: {
  documents: Document[]; assets: Item[]; contacts: Item[];
  saveReview: (review: SavedWillReview) => Promise<unknown>;
  addNote: () => void; ref?: Ref<WillJourneyHandle>;
}) {
  const [active, setActive] = useState<SavedWillReview | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const scroll = useRef(false);
  useEffect(() => {
    if (!scroll.current || !active) return;
    scroll.current = false;
    (document.getElementById(showSaved ? 'will-review-result-title' : 'will-review-title'))?.scrollIntoView({ block: 'start' });
  }, [version, active, showSaved]);
  function navigate(action: () => void) { if (dirty) setPending(() => action); else action(); }
  function open(review: SavedWillReview, saved: boolean) {
    navigate(() => { setActive(review); setShowSaved(saved); setDirty(false); setVersion(v => v + 1); scroll.current = true; });
  }
  useImperativeHandle(ref, () => ({ openSavedReview: review => open(review, true) }));
  return <section className="will-journey" aria-label="พินัยกรรมและความประสงค์">
    <div className="panel will-journey-intro">
      <div><h2>เริ่มจากสิ่งที่คุณต้องการทำ</h2><p className="muted">เลือกตรวจพินัยกรรมที่มีอยู่ หรือบันทึกสิ่งที่อยากบอกคนใกล้ชิด</p></div>
      <div className="will-journey-choices">
        <button type="button" className="will-journey-choice" onClick={() => open({ id: crypto.randomUUID(), data: { ...emptyWillReview } }, false)}>
          <strong>ตรวจพินัยกรรมที่มีอยู่</strong><span>ตอบคำถามเพื่อดูข้อมูลที่ยังขาดและประเด็นที่ควรตรวจเพิ่มเติม</span><span className="will-journey-link">เริ่มตรวจพินัยกรรม →</span>
        </button>
        <button type="button" className="will-journey-choice" onClick={addNote}>
          <strong>บันทึกความประสงค์</strong><span>ฝากข้อความหรือสิ่งที่อยากให้คนใกล้ชิดทราบ</span><span className="will-journey-link">เพิ่มบันทึก →</span>
        </button>
      </div>
    </div>
    {active && <div>
      <WillReviewPanel key={version} initial={active.data} documents={documents} assets={assets} contacts={contacts} save={data => saveReview({ id: active.id, data })} showSavedResult={showSaved} onDirtyChange={setDirty} />
    </div>}
    {pending && <DiscardDialog cancel={() => setPending(null)} discard={() => { const action = pending; setPending(null); action(); }} />}
  </section>;
}
