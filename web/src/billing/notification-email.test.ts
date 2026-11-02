import fc from 'fast-check';
import { expect, test } from 'vitest';
import { isNotificationEmail } from './notification-email';

test('@가 없는 문자열은 결제 안내 이메일이 아니다', () => {
  fc.assert(
    fc.property(fc.string().filter((value) => !value.includes('@')), (value) => {
      expect(isNotificationEmail(value)).toBe(false);
    }),
  );
});

test.each([
  ['billing@example.com', true],
  ['a.b@mail.example.co.kr', true],
  ['billing@example', false],
  ['billing@.com', false],
  ['billing@example.', false],
  ['a@b@example.com', false],
  ['@example.com', false],
  ['wrong@', false],
])('%s는 결제 안내 이메일 여부가 %s다', (email, expected) => {
  expect(isNotificationEmail(email)).toBe(expected);
});
