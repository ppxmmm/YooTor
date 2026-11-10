export type EstimateInput = { assets: number; debt: number; rate: 5 | 10 };
export function estimateInheritanceTax(input: EstimateInput) {
  if (![input.assets, input.debt].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1_000_000_000_000)) throw new Error('กรุณาระบุจำนวนเงินบาทเป็นเลขเต็มไม่เกิน 1 ล้านล้านบาท');
  if (input.rate !== 5 && input.rate !== 10) throw new Error('กรุณาเลือกอัตราสมมติ');
  if (input.debt > input.assets) throw new Error('ภาระหนี้ที่ระบุต้องไม่เกินมูลค่าทรัพย์สิน');
  const net = input.assets - input.debt;
  const taxable = Math.max(0, net - 100_000_000);
  const taxSatang = BigInt(taxable) * BigInt(input.rate);
  return { net, taxable, taxSatang };
}
export function formatSatang(satang: bigint) {
  return `${new Intl.NumberFormat('th-TH').format(satang / 100n)}.${(satang % 100n).toString().padStart(2, '0')}`;
}
