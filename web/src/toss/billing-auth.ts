import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

/**
 * 토스페이먼츠 카드 등록창(결제창) 경계.
 *
 * 빌링키 발급에는 API 개별 연동 키(ck)가 필요합니다. 결제위젯 키(gck)에는 빌링키 발급 기능이 없습니다.
 */

export type ClientKeyCheck =
  | Readonly<{ kind: 'test' }>
  | Readonly<{ kind: 'live' }>
  | Readonly<{ kind: 'widget_key' }>
  | Readonly<{ kind: 'secret_key' }>
  | Readonly<{ kind: 'unknown_format' }>;

/** 잘못된 키를 결제창까지 보내지 않도록 접두사로 종류를 판정합니다. */
export function checkClientKey(clientKey: string): ClientKeyCheck {
  if (clientKey.includes('_sk_')) return { kind: 'secret_key' };
  if (clientKey.includes('_gck_')) return { kind: 'widget_key' };
  if (clientKey.startsWith('test_ck_')) return { kind: 'test' };
  if (clientKey.startsWith('live_ck_')) return { kind: 'live' };
  return { kind: 'unknown_format' };
}

export type BillingAuthRequest = Readonly<{
  clientKey: string;
  customerKey: string;
  successUrl: string;
  failUrl: string;
  customerEmail: string;
  customerName: string;
}>;

export type BillingAuthFailure = Readonly<{ code: string; message: string }>;

function toFailure(error: unknown): BillingAuthFailure {
  if (error instanceof Error) {
    const code = 'code' in error && typeof error.code === 'string' ? error.code : error.name;
    return { code, message: error.message };
  }
  return { code: 'UNKNOWN', message: String(error) };
}

/**
 * 카드 등록창을 엽니다.
 *
 * 인증에 성공하면 토스가 `successUrl`로 이동시키므로 이 함수는 돌아오지 않습니다.
 * 값이 돌아왔다면 창을 열지 못했거나 이동하지 못한 것입니다.
 */
export async function requestCardBillingAuth(request: BillingAuthRequest): Promise<BillingAuthFailure> {
  try {
    const tossPayments = await loadTossPayments(request.clientKey);
    await tossPayments.payment({ customerKey: request.customerKey }).requestBillingAuth({
      method: 'CARD',
      successUrl: request.successUrl,
      failUrl: request.failUrl,
      customerEmail: request.customerEmail,
      customerName: request.customerName,
    });
    return { code: 'NO_REDIRECT', message: '카드 등록창으로 이동하지 못했습니다.' };
  } catch (error: unknown) {
    return toFailure(error);
  }
}

/** 카드 등록창이 돌려준 결과. `authKey`는 일회성입니다. */
export type BillingAuthCallback =
  | Readonly<{ kind: 'authorized'; customerKey: string; authKey: string }>
  | Readonly<{ kind: 'failed'; code: string; message: string | null }>
  | Readonly<{ kind: 'invalid' }>;

/** 성공은 `customerKey`와 `authKey`, 실패는 `code`가 있어야 인정합니다. 그 외에는 발급을 요청하지 않습니다. */
export function readBillingAuthCallback(params: URLSearchParams): BillingAuthCallback {
  const customerKey = params.get('customerKey');
  const authKey = params.get('authKey');
  if (customerKey !== null && authKey !== null && authKey.length > 0) {
    return { kind: 'authorized', customerKey, authKey };
  }
  const code = params.get('code');
  if (code !== null) {
    return { kind: 'failed', code, message: params.get('message') };
  }
  return { kind: 'invalid' };
}
