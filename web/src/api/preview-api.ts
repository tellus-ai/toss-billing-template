import * as z from 'zod';
import { nextBillingDate } from '../billing/billing-date';
import { ApiError } from './api-error';
import { paymentMethodSchema, subscriptionSchema, userSchema } from './schemas';
import type { BillingApi, PaymentMethod, Subscription, User } from './types';

/**
 * 서버 없이 화면을 확인하기 위한 가짜 API입니다. 실제 서비스에 쓰면 안 됩니다.
 *
 * 상태는 브라우저 탭의 sessionStorage에만 두며, 카드 정보는 끝 네 자리만 남깁니다.
 */

type PreviewStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type PreviewPlan = Readonly<{
  name: string;
  monthlySupplyAmount: number;
  monthlyAmount: number;
  includedUnits: number;
  unitLabel: string;
  overageUnitAmount: number;
}>;

type PreviewDependencies = Readonly<{
  storage: PreviewStorage;
  now: () => Date;
  newId: () => string;
  account: Readonly<{ loginId: string; password: string }>;
  plan: PreviewPlan;
}>;

const STORAGE_KEY = 'template.preview';
/** 미리보기에서 보여줄 이번 주기 사용량. 제공량을 조금 넘겨 추가 사용료가 보이게 합니다. */
const PREVIEW_USED_UNITS = 103;

const previewStateSchema = z.object({
  user: userSchema.nullable(),
  paymentMethods: z.array(paymentMethodSchema),
  subscription: subscriptionSchema.nullable(),
  payments: z.array(
    z.object({
      id: z.string(),
      paidAt: z.string(),
      type: z.string(),
      orderName: z.string(),
      amount: z.number(),
      status: z.string(),
      receiptUrl: z.string().nullable(),
    }),
  ),
});

type PreviewState = z.infer<typeof previewStateSchema>;

const EMPTY_STATE: PreviewState = { user: null, paymentMethods: [], subscription: null, payments: [] };

export function createPreviewApi({ storage, now, newId, account, plan }: PreviewDependencies): BillingApi {
  function read(): PreviewState {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === null) return EMPTY_STATE;
    const parsed = previewStateSchema.safeParse(JSON.parse(saved));
    if (!parsed.success) throw new Error('미리보기 상태가 올바르지 않습니다. 브라우저 탭을 닫고 다시 열어 주세요.');
    return parsed.data;
  }

  function write(state: PreviewState): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function requireSubscription(state: PreviewState): Subscription {
    if (state.subscription === null) throw new ApiError('SUBSCRIPTION_NOT_FOUND', '구독 중인 요금제가 없습니다.', 404);
    return state.subscription;
  }

  function addCard(cardCompany: string, lastFour: string): PaymentMethod {
    const state = read();
    const method: PaymentMethod = {
      id: newId(),
      cardCompany,
      maskedNumber: `****-****-****-${lastFour}`,
      isDefault: state.paymentMethods.length === 0,
    };
    write({ ...state, paymentMethods: [...state.paymentMethods, method] });
    return method;
  }

  return {
    login: async ({ loginId, password }) => {
      if (loginId !== account.loginId || password !== account.password) {
        throw new ApiError('AUTH_FAILED', '아이디 또는 비밀번호가 일치하지 않습니다.', 401);
      }
      const user: User = { loginId, name: '심사 담당자', email: 'review@example.com' };
      write({ ...read(), user });
      return user;
    },
    logout: async () => storage.removeItem(STORAGE_KEY),
    getMe: async () => read().user,
    getCheckout: async () => {
      const state = read();
      const startsAt = now();
      return {
        subscription: state.subscription,
        paymentMethod: state.paymentMethods.find((method) => method.isDefault) ?? null,
        quote: {
          supplyAmount: plan.monthlySupplyAmount,
          vatAmount: plan.monthlyAmount - plan.monthlySupplyAmount,
          totalAmount: plan.monthlyAmount,
        },
        startsAt: startsAt.toISOString(),
        nextBillingAt: nextBillingDate(startsAt, startsAt.getUTCDate()).toISOString(),
      };
    },
    getBilling: async () => {
      const state = read();
      const overageAmount = Math.max(0, PREVIEW_USED_UNITS - plan.includedUnits) * plan.overageUnitAmount;
      return {
        subscription: state.subscription,
        paymentMethods: state.paymentMethods,
        payments: state.payments,
        usage: { usedUnits: PREVIEW_USED_UNITS, includedUnits: plan.includedUnits, unitLabel: plan.unitLabel },
        nextCharge: {
          subscriptionAmount: plan.monthlyAmount,
          overageAmount,
          totalAmount: plan.monthlyAmount + overageAmount,
        },
      };
    },
    createAuthSession: async () => ({ customerKey: `cus_${newId()}` }),
    issueBillingKey: async () => addCard('토스 테스트카드', '1234'),
    registerCard: async (card) => {
      if (card.cardNumber.startsWith('0000')) {
        throw new ApiError('CARD_REJECTED', '카드 정보를 확인하고 다시 입력해 주세요.', 400);
      }
      return addCard('테스트카드', card.cardNumber.slice(-4));
    },
    setDefaultPaymentMethod: async (id) => {
      const state = read();
      write({ ...state, paymentMethods: state.paymentMethods.map((method) => ({ ...method, isDefault: method.id === id })) });
    },
    deletePaymentMethod: async (id) => {
      const state = read();
      const remaining = state.paymentMethods.filter((method) => method.id !== id);
      const hasDefault = remaining.some((method) => method.isDefault);
      write({
        ...state,
        paymentMethods: remaining.map((method, index) => (hasDefault || index > 0 ? method : { ...method, isDefault: true })),
      });
    },
    startSubscription: async () => {
      const state = read();
      if (state.subscription !== null) throw new ApiError('SUBSCRIPTION_CONFLICT', '이미 구독 중입니다.', 409);
      if (!state.paymentMethods.some((method) => method.isDefault)) {
        throw new ApiError('PAYMENT_METHOD_NOT_FOUND', '등록된 카드가 없습니다.', 404);
      }
      const paidAt = now();
      const subscription: Subscription = {
        status: 'ACTIVE',
        planName: plan.name,
        startedAt: paidAt.toISOString(),
        nextBillingAt: nextBillingDate(paidAt, paidAt.getUTCDate()).toISOString(),
        cancelAt: null,
      };
      const payment = {
        id: `sub_${newId()}`,
        paidAt: paidAt.toISOString(),
        type: '최초 결제',
        orderName: `${plan.name} 구독`,
        amount: plan.monthlyAmount,
        status: '결제 완료',
        receiptUrl: null,
      };
      write({ ...state, subscription, payments: [payment, ...state.payments] });
      return subscription;
    },
    cancelSubscription: async () => {
      const state = read();
      const subscription = requireSubscription(state);
      // 이용 기간은 다음 결제일 전날까지입니다.
      const lastServiceDay = new Date(subscription.nextBillingAt);
      lastServiceDay.setUTCDate(lastServiceDay.getUTCDate() - 1);
      const canceled: Subscription = { ...subscription, cancelAt: lastServiceDay.toISOString() };
      write({ ...state, subscription: canceled });
      return canceled;
    },
    payOverdue: async () => requireSubscription(read()),
  };
}
