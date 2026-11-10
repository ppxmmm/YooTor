import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createService } from '../src/lib/server';

describe('estate record additions', () => {
  it('preserves structured details when an asset is edited and keeps household records private', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'yootor-estate-')));
    const owner = await service.auth({ action: 'demo', role: 'OWNER' });
    const other = await service.auth({ action: 'demo', role: 'OWNER' });
    const asset = await service.mutate(owner.token, 'assets', 'POST', { name: 'บ้าน', category: 'property', valuedAt: '2026-11-10', ownership: 'joint', ownershipShare: 50, debtOutstanding: 1000 });
    await service.mutate(owner.token, 'assets', 'PATCH', { id: asset.id, name: 'บ้านสวน' });
    const changed = (await service.state(owner.token)).assets.find(a => a.id === asset.id);
    expect(changed).toMatchObject({ name: 'บ้านสวน', ownership: 'joint', ownershipShare: 50, debtOutstanding: 1000 });
    expect((await service.state(other.token)).assets.some(a => a.id === asset.id)).toBe(false);
    await service.mutate(owner.token, 'profile', 'PATCH', { debts: [{ id: 'debt-1', creditor: 'เจ้าหนี้', kind: 'loan', amount: 1000, asOf: '', security: 'yes', assetId: asset.id, notes: '' }] });
    expect((await service.state(owner.token)).profile.debts).toHaveLength(1);
    expect((await service.state(other.token)).profile.debts).toBeUndefined();
    await expect(service.mutate(owner.token, 'assets', 'PATCH', { id: asset.id, ownershipShare: 101 })).rejects.toThrow();
    const contact = (await service.state(owner.token)).contacts[0].id;
    const second = await service.mutate(owner.token, 'contacts', 'POST', { name: 'อีกคน', kind: 'beneficiary' });
    await service.mutate(owner.token, 'assets', 'PATCH', { id: asset.id, beneficiaryIds: [contact, second.id], beneficiaryShares: [{ contactId: contact, share: 50 }, { contactId: second.id, share: 25 }] });
    expect((await service.state(owner.token)).assets.find(a => a.id === asset.id)?.beneficiaryShares).toHaveLength(2);
    await expect(service.mutate(owner.token, 'assets', 'PATCH', { id: asset.id, beneficiaryShares: [{ contactId: contact, share: 80 }, { contactId: second.id, share: 30 }] })).rejects.toThrow();
    await expect(service.mutate(owner.token, 'assets', 'PATCH', { id: asset.id, beneficiaryIds: [(await service.state(other.token)).contacts[0].id], beneficiaryShares: [] })).rejects.toThrow();
  });
  it('stores structured insurance without losing it on other edits', async () => {
    const service = createService(await mkdtemp(join(tmpdir(), 'yootor-policy-')));
    const owner = await service.auth({ action: 'demo', role: 'OWNER' });
    const insurance = { insured: 'ผู้เอาประกัน', policyType: 'life', policyStatus: 'active', startDate: '', endDate: '', beneficiaryKind: 'named', beneficiaries: [{ name: 'ผู้รับ', relationship: 'บุตร', share: 100 }], premiumsPaid: 10000 };
    const row = await service.mutate(owner.token, 'assets', 'POST', { name: 'กรมธรรม์', category: 'insurance', insurance });
    await service.mutate(owner.token, 'assets', 'PATCH', { id: row.id, name: 'กรมธรรม์ใหม่' });
    expect((await service.state(owner.token)).assets.find(a => a.id === row.id)?.insurance).toEqual(insurance);
    await expect(service.mutate(owner.token, 'assets', 'PATCH', { id: row.id, insurance: { ...insurance, beneficiaries: [{ ...insurance.beneficiaries[0], share: 20 }] } })).rejects.toThrow();
    await expect(service.mutate(owner.token, 'assets', 'PATCH', { id: row.id, insurance: { ...insurance, startDate: '2026-12-01', endDate: '2026-01-01' } })).rejects.toThrow();
  });
});
