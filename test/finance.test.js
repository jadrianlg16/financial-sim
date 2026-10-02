import { describe, expect, it } from 'vitest';
import {
  buildAmortization,
  buildBalloonAmortization,
  equivalentAnnualCost,
  irr,
  npv,
  pmt,
  solvePeriodicRate,
} from '../src/domain/finance.js';

describe('pmt', () => {
  it('matches the textbook annuity payment', () => {
    // 100,000 at 12% a year over 12 months.
    expect(pmt(100000, 0.12, 12).toFixed(2)).toBe('8884.88');
  });

  it('splits the principal evenly at a zero rate', () => {
    expect(pmt(120000, 0, 24)).toBe(5000);
  });

  it('returns 0 when there are no months to pay', () => {
    expect(pmt(100000, 0.12, 0)).toBe(0);
  });
});

describe('buildAmortization', () => {
  it('pays the loan down to zero and reports total interest', () => {
    const { payment, rows, totalPaid, totalInterest } = buildAmortization(100000, 0.12, 12);
    expect(rows).toHaveLength(12);
    expect(rows.at(-1).balance).toBeCloseTo(0, 6);
    expect(rows.at(-1).cumPrin).toBeCloseTo(100000, 6);
    expect(totalPaid).toBeCloseTo(payment * 12, 9);
    expect(totalInterest).toBeCloseTo(rows.at(-1).cumInt, 6);
    // First month's interest is one month of 12% a year on the full principal.
    expect(rows[0].interest).toBeCloseTo(1000, 9);
  });

  it('returns an empty schedule when nothing is financed', () => {
    expect(buildAmortization(0, 0.12, 12)).toEqual({
      payment: 0,
      rows: [],
      totalPaid: 0,
      totalInterest: 0,
    });
  });
});

describe('buildBalloonAmortization', () => {
  it('leaves exactly the balloon for the last month and lowers the regular payment', () => {
    const plain = buildAmortization(200000, 0.135, 48);
    const balloon = buildBalloonAmortization(200000, 0.135, 48, 70000);
    expect(balloon.payment).toBeLessThan(plain.payment);
    expect(balloon.balloon).toBe(70000);
    expect(balloon.rows.at(-2).balance).toBeGreaterThan(70000);
    expect(balloon.rows.at(-1).balance).toBeCloseTo(0, 6);
    expect(balloon.rows.at(-1).balloon).toBeGreaterThan(0);
    expect(balloon.totalPaid).toBeCloseTo(balloon.payment * 48 + 70000, 6);
    expect(balloon.totalInterest).toBeCloseTo(balloon.totalPaid - 200000, 6);
  });

  it('caps the balloon at the principal', () => {
    expect(buildBalloonAmortization(50000, 0.1, 12, 90000).balloon).toBe(50000);
  });
});

describe('npv', () => {
  it('discounts each cash flow by its period', () => {
    // -1000 today, then 500 at the end of years 1 and 2, at 10%.
    expect(npv(0.1, [-1000, 500, 500])).toBeCloseTo(-1000 + 500 / 1.1 + 500 / 1.21, 9);
  });

  it('is the plain sum at a zero rate', () => {
    expect(npv(0, [-100, 30, 40, 50])).toBe(20);
  });
});

describe('irr', () => {
  it('finds the rate that makes NPV zero', () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
    const rate = irr([-1000, 300, 400, 500]);
    expect(npv(rate, [-1000, 300, 400, 500])).toBeCloseTo(0, 4);
    expect(rate).toBeCloseTo(0.0889633947, 6);
  });

  it('returns NaN when the cash flows never change sign', () => {
    expect(irr([100, 50, 25])).toBeNaN();
    expect(irr([-100, -50, -25])).toBeNaN();
  });
});

describe('solvePeriodicRate', () => {
  it('inverts pmt', () => {
    const payment = pmt(100000, 0.12, 12);
    expect(solvePeriodicRate(100000, payment, 12)).toBeCloseTo(0.01, 6);
  });

  it('returns 0 for degenerate inputs', () => {
    expect(solvePeriodicRate(0, 1000, 12)).toBe(0);
    expect(solvePeriodicRate(1000, 0, 12)).toBe(0);
  });
});

describe('equivalentAnnualCost', () => {
  it('turns a present-value cost into a level annual amount', () => {
    const eac = equivalentAnnualCost(1000, 0.1, 3);
    // Discounting three payments of `eac` at 10% gives back the present value.
    expect(npv(0.1, [0, eac, eac, eac])).toBeCloseTo(1000, 9);
  });

  it('handles a zero rate and a zero horizon', () => {
    expect(equivalentAnnualCost(900, 0, 3)).toBe(300);
    expect(equivalentAnnualCost(900, 0.1, 0)).toBe(900);
  });
});
