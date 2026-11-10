import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { emptyWillReview, reviewWill } from '../src/lib/will-review';
import { createService } from '../src/lib/server';

describe('will review', () => {
  it('treats missing answers as needing review and asks only the selected form questions', () => {
    const incomplete = reviewWill({ ...emptyWillReview, form: 'handwritten' });
    expect(incomplete.some(f => f.label === 'เขียนด้วยลายมือทั้งฉบับ')).toBe(true);
    expect(incomplete.some(f => f.label === 'จำนวนพยาน')).toBe(false);
    expect(reviewWill({ ...emptyWillReview, form: 'ordinary', witnessCount: '1' }).some(f => f.label === 'จำนวนพยาน' && f.level === 'review')).toBe(true);
  });
  it('checks age on the signing date without treating a clause conflict as invalidating the entire document', () => {
    const result = reviewWill({ ...emptyWillReview, form: 'ordinary', birthDate: '2011-06-01', signedDate: '2026-05-31', beneficiaryConflict: 'yes' });
    expect(result.some(f => f.label === 'อายุผู้ทำ')).toBe(true);
    expect(result.find(f => f.label.startsWith('ผู้รับเกี่ยวข้อง'))?.detail).toContain('ไม่ได้สรุปผลทั้งฉบับ');
    expect(reviewWill({ ...emptyWillReview, birthDate: '2011-06-01', signedDate: '2026-06-01' }).some(f => f.label === 'อายุผู้ทำ')).toBe(false);
  });
  it('flags a witness signing issue and unknown court-order information for review', () => {
    const result = reviewWill({ ...emptyWillReview, form: 'ordinary', witnesses: [{ birthDate: '', signedTogether: 'no', spouseOfBeneficiary: 'yes' }] });
    expect(result.some(f => f.label === 'การลงชื่อพยานคนที่ 1')).toBe(true);
    expect(result.some(f => f.label === 'คำสั่งศาลที่เกี่ยวข้อง' && f.level === 'missing')).toBe(true);
  });
  it('persists the review for the owner without sharing it with a family user', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'yootor-will-')));
    const owner = await service.auth({ action: 'demo', role: 'OWNER' });
    const family = await service.auth({ action: 'demo', role: 'FAMILY' }, owner.household);
    await service.mutate(owner.token, 'profile', 'PATCH', { willReview: { ...emptyWillReview, form: 'handwritten', name: 'เจ้าของ' } });
    expect((await service.state(owner.token)).profile.willReview).toMatchObject({ name: 'เจ้าของ' });
    expect((await service.state(family.token)).profile.willReview).toBeUndefined();
    await expect(service.mutate(owner.token, 'profile', 'PATCH', { willReview: { ...emptyWillReview, signature: 'invalid' } })).rejects.toThrow();
  });
  it('preserves older answers and stores multiple reviews with linked records', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'yootor-will-multi-')));
    const owner = await service.auth({ action: 'demo', role: 'OWNER' });
    const before = await service.state(owner.token);
    const old = { ...emptyWillReview, form: 'handwritten' as const, name: 'รายแรก' };
    await service.mutate(owner.token, 'profile', 'PATCH', { willReview: old });
    const reviews = [
      { id: 'legacy', data: old },
      { id: 'second', data: { ...emptyWillReview, form: 'ordinary' as const, name: 'รายที่สอง', assetIds: [before.assets[0].id], beneficiaryIds: [before.contacts[0].id], witnessNames: ['พยาน'], writerName: 'ผู้เขียน' } },
    ];
    await service.mutate(owner.token, 'profile', 'PATCH', { willReviews: reviews });
    const after = await service.state(owner.token);
    expect(after.profile.willReview).toMatchObject({ name: 'รายแรก' });
    expect(after.profile.willReviews).toEqual(reviews);
    expect(after.assets).toEqual(before.assets);
  });
});
