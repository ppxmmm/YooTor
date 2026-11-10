import { describe, expect, it } from 'vitest';
import { estimateInheritanceTax, formatSatang } from '../src/lib/inheritance-estimate';

describe('bounded inheritance tax illustration', () => {
  it('calculates only the amount above the threshold for the chosen rate', () => {
    expect(estimateInheritanceTax({ assets: 100_000_000, debt: 0, rate: 5 }).taxSatang).toBe(0n);
    expect(formatSatang(estimateInheritanceTax({ assets: 120_000_001, debt: 0, rate: 5 }).taxSatang)).toBe('1,000,000.05');
    expect(formatSatang(estimateInheritanceTax({ assets: 130_000_000, debt: 10_000_000, rate: 10 }).taxSatang)).toBe('2,000,000.00');
  });
  it('rejects invalid figures instead of producing a misleading estimate', () => {
    expect(() => estimateInheritanceTax({ assets: 1, debt: 2, rate: 5 })).toThrow();
    expect(() => estimateInheritanceTax({ assets: NaN, debt: 0, rate: 5 })).toThrow();
    expect(() => estimateInheritanceTax({ assets: 1.5, debt: 0, rate: 5 })).toThrow();
  });
});
