import { expect, test } from 'vitest';
import { checkClientKey, readBillingAuthCallback } from './billing-auth';

test.each([
  ['test_ck_abc', 'test'],
  ['live_ck_abc', 'live'],
  ['live_sk_abc', 'secret_key'],
  ['test_gck_abc', 'widget_key'],
  ['test_sk_abc', 'secret_key'],
  ['', 'unknown_format'],
  ['ck_abc', 'unknown_format'],
])('클라이언트 키 %s의 판정은 %s다', (clientKey, expected) => {
  expect(checkClientKey(clientKey).kind).toBe(expected);
});

test('성공 콜백은 customerKey와 authKey가 모두 있어야 인정한다', () => {
  expect(readBillingAuthCallback(new URLSearchParams('customerKey=cus_1&authKey=auth_1'))).toEqual({
    kind: 'authorized',
    customerKey: 'cus_1',
    authKey: 'auth_1',
  });
  expect(readBillingAuthCallback(new URLSearchParams('customerKey=cus_1&authKey='))).toEqual({ kind: 'invalid' });
  expect(readBillingAuthCallback(new URLSearchParams('authKey=auth_1'))).toEqual({ kind: 'invalid' });
});

test('실패 콜백은 토스가 보낸 code와 message를 담는다', () => {
  expect(readBillingAuthCallback(new URLSearchParams('code=PAY_PROCESS_CANCELED&message=취소'))).toEqual({
    kind: 'failed',
    code: 'PAY_PROCESS_CANCELED',
    message: '취소',
  });
});
