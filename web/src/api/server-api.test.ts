import { describe, expect, test } from 'vitest';
import { ApiError } from './api-error';
import { createServerApi } from './server-api';

type RecordedRequest = Readonly<{ url: string; init: RequestInit | undefined }>;

/** 서버 응답을 정해 두고 요청을 기록하는 fetch 대역이다. */
function recordingFetch(respond: () => Response | Promise<Response>) {
  const requests: RecordedRequest[] = [];
  const fetchFn: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return respond();
  };
  return { requests, fetchFn };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('createServerApi', () => {
  test('로그인은 쿠키를 포함해 JSON으로 보낸다', async () => {
    const { requests, fetchFn } = recordingFetch(() => json(200, { loginId: 'review', name: '심사', email: null }));
    const api = createServerApi({ baseUrl: '/api', fetchFn });

    const user = await api.login({ loginId: 'review', password: 'secret' });

    expect(user).toEqual({ loginId: 'review', name: '심사', email: null });
    expect(requests[0]?.url).toBe('/api/auth/login');
    expect(requests[0]?.init?.method).toBe('POST');
    expect(requests[0]?.init?.credentials).toBe('include');
    expect(requests[0]?.init?.body).toBe(JSON.stringify({ loginId: 'review', password: 'secret' }));
  });

  test('로그인하지 않은 상태의 401은 사용자 없음으로 본다', async () => {
    const { fetchFn } = recordingFetch(() => json(401, { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' }));
    await expect(createServerApi({ baseUrl: '/api', fetchFn }).getMe()).resolves.toBeNull();
  });

  test('실패 응답은 서버가 준 code와 message를 담은 ApiError가 된다', async () => {
    const { fetchFn } = recordingFetch(() => json(400, { code: 'CARD_REJECTED', message: '카드를 확인해 주세요.' }));
    const api = createServerApi({ baseUrl: '/api', fetchFn });

    const error = await api.startSubscription().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'CARD_REJECTED', message: '카드를 확인해 주세요.', status: 400 });
  });

  test('통신 실패는 NETWORK_ERROR가 된다', async () => {
    const fetchFn: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(createServerApi({ baseUrl: '/api', fetchFn }).getBilling()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  test('계약과 다른 성공 응답은 화면에 넘기지 않고 INVALID_RESPONSE로 거부한다', async () => {
    const { fetchFn } = recordingFetch(() => json(200, { subscription: null }));
    await expect(createServerApi({ baseUrl: '/api', fetchFn }).getBilling()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  test('본문이 없는 204 응답은 성공으로 끝난다', async () => {
    const { requests, fetchFn } = recordingFetch(() => new Response(null, { status: 204 }));
    await expect(createServerApi({ baseUrl: '/api', fetchFn }).deletePaymentMethod('7')).resolves.toBeUndefined();
    expect(requests[0]?.url).toBe('/api/billing/payment-methods/7');
    expect(requests[0]?.init?.method).toBe('DELETE');
  });
});
