import fc from 'fast-check';
import { expect, test } from 'vitest';
import { immediateRefundAmount, remainingPeriodAmount } from './refund';

const refundCase = fc
  .record({
    paidAmount: fc.integer({ min: 0, max: 10_000_000 }),
    periodDays: fc.integer({ min: 28, max: 31 }),
    deductions: fc.integer({ min: 0, max: 1_000_000 }),
  })
  .chain((base) => fc.record({ remainingDays: fc.integer({ min: 0, max: base.periodDays }) }).map((rest) => ({ ...base, ...rest })));

test('즉시 해지 환불액은 0원 이상이고 결제 금액을 넘지 않는다', () => {
  fc.assert(
    fc.property(refundCase, (input) => {
      const refund = immediateRefundAmount(input);
      expect(refund).toBeGreaterThanOrEqual(0);
      expect(refund).toBeLessThanOrEqual(input.paidAmount);
      expect(Number.isInteger(refund)).toBe(true);
    }),
  );
});

test('공제액이 없으면 남은 기간을 일할 계산한 금액을 모두 환불한다', () => {
  fc.assert(
    fc.property(refundCase, (input) => {
      expect(immediateRefundAmount({ ...input, deductions: 0 })).toBe(remainingPeriodAmount(input));
    }),
  );
});

test('남은 일수가 많을수록 환불액이 줄지 않는다', () => {
  fc.assert(
    fc.property(refundCase, (input) => {
      const fewer = immediateRefundAmount({ ...input, remainingDays: Math.max(0, input.remainingDays - 1) });
      expect(immediateRefundAmount(input)).toBeGreaterThanOrEqual(fewer);
    }),
  );
});

test('환불 규정의 계산 예시와 같다', () => {
  const input = { paidAmount: 33_000, periodDays: 30, remainingDays: 20, deductions: 0 };
  expect(remainingPeriodAmount(input)).toBe(22_000);
  expect(immediateRefundAmount(input)).toBe(22_000);
  expect(immediateRefundAmount({ ...input, deductions: 3_300 })).toBe(18_700);
});
