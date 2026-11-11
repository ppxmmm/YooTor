import { describe, it, expect } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createService } from '../src/lib/server';
import { emptyWillReview, reviewWill, willReviewSchema } from '../src/lib/will-review';

describe('additional non-AI features', () => {
  it('keeps old reviews readable and flags handwritten amendments needing review', () => {
    expect(willReviewSchema.parse(emptyWillReview)).toEqual(emptyWillReview);
    const findings = reviewWill({ ...emptyWillReview, form: 'handwritten', alterations: 'yes', alterationsHandwritten: 'no' });
    expect(findings.some(f => f.label === 'การแก้ไขด้วยลายมือผู้ทำ' && f.level === 'review')).toBe(true);
  });
  it('records owner-only asset changes, keeps old insurance notes and removes history on deletion', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'yootor-history-')));
    const owner = await service.auth({ action: 'demo', role: 'OWNER' });
    const family = await service.auth({ action: 'demo', role: 'FAMILY' }, owner.household);
    const asset = await service.mutate(owner.token, 'assets', 'POST', { name: 'กรมธรรม์เก่า', category: 'insurance', notes: 'ผู้เอาประกัน: ก' });
    await service.mutate(owner.token, 'assets', 'PATCH', { id: asset.id, insurance: { insured: 'ก', policyType: 'other', policyStatus: 'unknown', startDate: '', endDate: '', beneficiaryKind: 'unknown', beneficiaries: [], premiumsPaid: null } });
    await service.mutate(owner.token, 'assets', 'PATCH', { id: asset.id, value: 500 });
    const state = await service.state(owner.token);
    expect(state.assets.find(a => a.id === asset.id)?.notes).toBe('ผู้เอาประกัน: ก');
    expect(state.profile.assetHistory).toHaveLength(1);
    expect((await service.state(family.token)).profile.assetHistory).toBeUndefined();
    await service.mutate(owner.token, 'assets', 'DELETE', { id: asset.id });
    expect((await service.state(owner.token)).profile.assetHistory).toHaveLength(0);
  });
  it('limits simulated evidence to the request owner and the demo household owner', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'yootor-evidence-')));
    const owner = await service.auth({ action: 'demo', role: 'OWNER' });
    const other = await service.auth({ action: 'demo', role: 'OWNER' });
    const family = await service.auth({ action: 'demo', role: 'FAMILY' }, owner.household);
    const request = await service.mutate(family.token, 'requests', 'POST', {});
    const requestId = String(request.id);
    const bytes = Buffer.from('%PDF-1.4\nexample\n%%EOF');
    const file = await service.uploadRequestEvidence(family.token, requestId, { name: 'sample.pdf', bytes });
    expect(file.content).toBeUndefined();
    const visible = (await service.state(owner.token)).requests.find(r => r.id === requestId);
    expect(JSON.stringify(visible)).not.toContain(bytes.toString('base64'));
    expect((await service.downloadRequestEvidence(owner.token, requestId, file.id)).bytes).toEqual(bytes);
    await expect(service.downloadRequestEvidence(other.token, requestId, file.id)).rejects.toThrow();
    await expect(service.uploadRequestEvidence(owner.token, requestId, { name: 'sample.pdf', bytes })).rejects.toThrow();
    await expect(service.uploadRequestEvidence(family.token, requestId, { name: 'bad.pdf', bytes: Buffer.from('not a pdf') })).rejects.toThrow();
    await service.mutate(owner.token, 'requests', 'PATCH', { id: requestId, status: 'approved' });
    await expect(service.uploadRequestEvidence(family.token, requestId, { name: 'sample.pdf', bytes })).rejects.toThrow();
  });
});
