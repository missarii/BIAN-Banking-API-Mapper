import { describe, expect, it } from 'vitest';
import { coverage } from '../index';

describe('coverage', () => {
  it('computes counts, percentages and per-area rows', () => {
    const m = coverage(['a', 'b', 'c'], [
      {
        apiId: 'a',
        domainId: 'd1',
        domainName: 'Current Account',
        businessArea: 'Accounts',
        score: 92,
        confidence: 'HIGH',
        status: 'ACCEPTED',
      },
      {
        apiId: 'b',
        domainId: 'd2',
        domainName: 'Fraud Evaluation',
        businessArea: 'Risk & Compliance',
        score: 55,
        confidence: 'MEDIUM',
        status: 'ACCEPTED',
      },
    ]);
    expect(m.totalApis).toBe(3);
    expect(m.mapped).toBe(2);
    expect(m.unmapped).toBe(1);
    expect(m.coveragePct).toBe(67);
    expect(m.high).toBe(1);
    expect(m.alignmentPct).toBe(50);
    expect(m.perArea.find((r) => r.area === 'Accounts')?.pct).toBe(100);
  });

  it('handles an empty registry without NaN', () => {
    const m = coverage([], []);
    expect(m.coveragePct).toBe(0);
    expect(m.alignmentPct).toBe(0);
  });
});
