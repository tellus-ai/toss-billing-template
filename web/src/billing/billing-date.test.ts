import fc from 'fast-check';
import { expect, test } from 'vitest';
import { nextBillingDate } from './billing-date';

const lastDayOfMonth = (year: number, monthIndex: number) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

test('다음 결제일은 다음 달의 최초 결제일이며 그 날짜가 없으면 말일이다', () => {
  const dueAt = fc.date({ min: new Date('2000-01-01T00:00:00Z'), max: new Date('2099-11-30T23:59:59Z'), noInvalidDate: true });
  fc.assert(
    fc.property(dueAt, fc.integer({ min: 1, max: 31 }), (due, anchorDay) => {
      const next = nextBillingDate(due, anchorDay);
      const expectedYear = due.getUTCMonth() === 11 ? due.getUTCFullYear() + 1 : due.getUTCFullYear();
      const expectedMonth = (due.getUTCMonth() + 1) % 12;

      expect(next.getUTCFullYear()).toBe(expectedYear);
      expect(next.getUTCMonth()).toBe(expectedMonth);
      expect(next.getUTCDate()).toBe(Math.min(anchorDay, lastDayOfMonth(expectedYear, expectedMonth)));
      expect(next.getUTCHours()).toBe(due.getUTCHours());
      expect(next.getUTCMinutes()).toBe(due.getUTCMinutes());
    }),
  );
});

test('31일에 시작한 구독은 2월 말일을 지나 3월 31일로 돌아온다', () => {
  const february = nextBillingDate(new Date('2026-01-31T01:00:00Z'), 31);
  expect(february.toISOString()).toBe('2026-02-28T01:00:00.000Z');
  expect(nextBillingDate(february, 31).toISOString()).toBe('2026-03-31T01:00:00.000Z');
  expect(nextBillingDate(new Date('2028-01-31T01:00:00Z'), 31).toISOString()).toBe('2028-02-29T01:00:00.000Z');
});

test('입력한 날짜 객체를 바꾸지 않는다', () => {
  const dueAt = new Date('2026-05-15T00:00:00Z');
  nextBillingDate(dueAt, 15);
  expect(dueAt.toISOString()).toBe('2026-05-15T00:00:00.000Z');
});
