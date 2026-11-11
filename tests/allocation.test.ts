import { describe, expect, it } from 'vitest';
import { allocationDispositions, allocationStatus, type PlanAsset } from '../src/lib/allocation';

const contacts = [{ id: 'a', name: 'ลูกคนแรก' }, { id: 'b', name: 'ลูกคนที่สอง' }];
const asset: PlanAsset = { id: 'house', name: 'บ้าน', category: 'property', reference: 'โฉนดตัวอย่าง', beneficiaryIds: ['a', 'b'], beneficiaryShares: [{ contactId: 'a', share: 60 }, { contactId: 'b', share: 40 }] };
describe('allocation planning', () => {
  it('shows both recipients and preserves their proportions and asset reference in the draft', () => {
    expect(allocationStatus(asset, contacts)).toMatchObject({ complete: true, total: 100 });
    expect(allocationDispositions([asset], contacts)).toBe('1. บ้าน (ข้อมูลระบุทรัพย์สิน: โฉนดตัวอย่าง) ให้แก่ ลูกคนแรก สัดส่วน 60% และ ลูกคนที่สอง สัดส่วน 40%');
  });
  it('does not create a draft for missing recipients, partial shares, deleted contacts, or insurance', () => {
    for (const item of [
      { ...asset, beneficiaryIds: [] },
      { ...asset, beneficiaryShares: [{ contactId: 'a', share: 60 }] },
      { ...asset, beneficiaryShares: [{ contactId: 'a', share: 40 }, { contactId: 'b', share: 40 }] },
      { ...asset, beneficiaryIds: ['missing'], beneficiaryShares: [{ contactId: 'missing', share: 100 }] },
      { ...asset, category: 'insurance' },
    ]) expect(() => allocationDispositions([item], contacts)).toThrow();
    expect(() => allocationDispositions([], contacts)).toThrow();
  });
});
