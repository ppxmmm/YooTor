export type PlanContact = { id: string; name: string };
export type PlanAsset = {
  id: string;
  name: string;
  category: string;
  reference?: string;
  beneficiaryIds?: string[];
  beneficiaryShares?: { contactId: string; share: number }[];
};

export function allocationStatus(asset: PlanAsset, contacts: PlanContact[]) {
  const ids = asset.beneficiaryIds || [];
  const shares = asset.beneficiaryShares || [];
  const people = ids.map(id => ({ id, name: contacts.find(contact => contact.id === id)?.name, share: shares.find(item => item.contactId === id)?.share }));
  const total = people.reduce((sum, person) => sum + (person.share ?? 0), 0);
  const missingNames = people.some(person => !person.name);
  const missingShares = people.some(person => person.share === undefined);
  const complete = people.length > 0 && !missingNames && !missingShares && Math.abs(total - 100) < 0.001;
  const status = !people.length ? 'ยังไม่ได้เลือกผู้รับ' : missingNames ? 'ไม่พบข้อมูลผู้รับบางคน' : missingShares ? 'ยังระบุสัดส่วนไม่ครบ' : Math.abs(total - 100) >= 0.001 ? 'สัดส่วนรวมยังไม่ครบ 100%' : 'ระบุผู้รับและสัดส่วนครบ';
  return { people, total, complete, status };
}

export function allocationDispositions(assets: PlanAsset[], contacts: PlanContact[]) {
  if (!assets.length) throw new Error('กรุณาเลือกทรัพย์สินอย่างน้อยหนึ่งรายการ');
  return assets.map((asset, index) => {
    const allocation = allocationStatus(asset, contacts);
    if (asset.category === 'insurance' || !allocation.complete) throw new Error('กรุณาตรวจผู้รับและสัดส่วนให้ครบก่อนสร้างฉบับร่าง');
    const reference = asset.reference?.trim() ? ` (ข้อมูลระบุทรัพย์สิน: ${asset.reference.trim()})` : ' (โปรดเพิ่มรายละเอียดเพื่อระบุทรัพย์สินให้ชัดเจน)';
    const people = allocation.people.map(person => `${person.name} สัดส่วน ${person.share}%`).join(' และ ');
    return `${index + 1}. ${asset.name}${reference} ให้แก่ ${people}`;
  }).join('\n');
}
