import type * as z from 'zod';
import { ApiError } from './api-error';
import {
  authSessionSchema,
  billingSchema,
  checkoutSchema,
  errorBodySchema,
  paymentMethodSchema,
  subscriptionSchema,
  userSchema,
} from './schemas';
import type { BillingApi } from './types';

type ServerApiDependencies = Readonly<{
  /** 예: `/api`. 요청 경로는 이 값 뒤에 붙습니다. */
  baseUrl: string;
  fetchFn: typeof fetch;
}>;

/** 실제 서버를 호출하는 API입니다. 응답은 스키마로 확인한 뒤에만 화면에 넘깁니다. */
export function createServerApi({ baseUrl, fetchFn }: ServerApiDependencies): BillingApi {
  async function send(method: string, path: string, body?: unknown): Promise<Response> {
    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('NETWORK_ERROR', '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', null);
    }
    if (response.ok) return response;

    const errorBody = errorBodySchema.safeParse(await response.json().catch(() => null));
    throw errorBody.success
      ? new ApiError(errorBody.data.code, errorBody.data.message, response.status)
      : new ApiError('UNKNOWN', '요청을 처리하지 못했습니다.', response.status);
  }

  async function request<T>(method: string, path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
    const response = await send(method, path, body);
    const parsed = schema.safeParse(await response.json().catch(() => undefined));
    if (!parsed.success) {
      console.error(`${method} ${path} 응답이 API 계약과 다릅니다.`, parsed.error.issues);
      throw new ApiError('INVALID_RESPONSE', '서버 응답을 처리하지 못했습니다.', response.status);
    }
    return parsed.data;
  }

  async function requestWithoutBody(method: string, path: string): Promise<void> {
    await send(method, path);
  }

  return {
    login: (input) => request('POST', '/auth/login', userSchema, input),
    logout: () => requestWithoutBody('POST', '/auth/logout'),
    getMe: async () => {
      try {
        return await request('GET', '/auth/me', userSchema);
      } catch (error: unknown) {
        // 로그인하지 않은 상태는 오류가 아닙니다.
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    getCheckout: () => request('GET', '/billing/checkout', checkoutSchema),
    getBilling: () => request('GET', '/billing', billingSchema),
    createAuthSession: (consent) => request('POST', '/billing/auth-sessions', authSessionSchema, consent),
    issueBillingKey: (input) => request('POST', '/billing/payment-method', paymentMethodSchema, input),
    registerCard: (input) => request('POST', '/billing/payment-methods/card', paymentMethodSchema, input),
    setDefaultPaymentMethod: (id) => requestWithoutBody('PATCH', `/billing/payment-methods/${encodeURIComponent(id)}/default`),
    deletePaymentMethod: (id) => requestWithoutBody('DELETE', `/billing/payment-methods/${encodeURIComponent(id)}`),
    startSubscription: () => request('POST', '/billing/subscription', subscriptionSchema),
    cancelSubscription: () => request('POST', '/billing/subscription/cancel', subscriptionSchema),
    payOverdue: () => request('POST', '/billing/subscription/renewal', subscriptionSchema),
  };
}
