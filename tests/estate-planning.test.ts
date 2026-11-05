import { describe, expect, it } from 'vitest';
import { buildWillDraft } from '../src/lib/estate-planning';
describe('will draft', () => {
  it('requires the testator and disposition rather than producing an empty will', () => {
    expect(() =>
      buildWillDraft({
        name: '',
        date: '',
        place: '',
        dispositions: '',
        executor: '',
      }),
    ).toThrow();
  });
  it('preserves dispositions and leaves signatures for execution outside the app', () => {
    const text = buildWillDraft({
      name: 'สมใจ',
      date: '2026-11-05',
      place: 'กรุงเทพฯ',
      dispositions: 'บ้านให้ลูกสาว',
      executor: 'สมชาย',
    });
    expect(text).toContain('บ้านให้ลูกสาว');
    expect(text).toContain('สมชาย');
    expect(text).toContain('พยานคนที่ 2');
    expect(text).toContain('ฉบับร่าง');
    expect(text).not.toContain('ลงนามแล้ว');
  });
});
