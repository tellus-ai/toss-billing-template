/**
 * 화면과 서버 사이의 API 계약. docs/05-subscription-pages.md의 API 계약 표와 같습니다.
 *
 * 금액과 결제일은 서버가 정합니다. 화면은 받은 값을 표시만 하고 결제 금액을 서버로 보내지 않습니다.
 */

export type User = Readonly<{
  loginId: string;
  name: string;
  email: string | null;
}>;

export type PaymentMethod = Readonly<{
  id: string;
  cardCompany: string;
  /** 토스가 마스킹한 번호. 카드 번호 전체는 저장하지도 응답하지도 않습니다. */
  maskedNumber: string;
  /** 구독료와 추가 사용료를 청구할 카드. */
  isDefault: boolean;
}>;

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';

export type Subscription = Readonly<{
  status: SubscriptionStatus;
  planName: string;
  startedAt: string;
  nextBillingAt: string;
  /** 해지 예약 시 이용 종료일. 예약만으로 상태는 바뀌지 않습니다. */
  cancelAt: string | null;
}>;

export type Quote = Readonly<{
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
}>;

export type Checkout = Readonly<{
  subscription: Subscription | null;
  /** 주 결제 카드. 없으면 카드 등록부터 해야 합니다. */
  paymentMethod: PaymentMethod | null;
  quote: Quote;
  startsAt: string;
  nextBillingAt: string;
}>;

export type Payment = Readonly<{
  id: string;
  paidAt: string;
  type: string;
  orderName: string;
  amount: number;
  status: string;
  /** 토스 승인 응답의 receipt.url. */
  receiptUrl: string | null;
}>;

export type Usage = Readonly<{
  usedUnits: number;
  includedUnits: number;
  unitLabel: string;
}>;

export type NextCharge = Readonly<{
  subscriptionAmount: number;
  overageAmount: number;
  totalAmount: number;
}>;

export type Billing = Readonly<{
  subscription: Subscription | null;
  paymentMethods: readonly PaymentMethod[];
  payments: readonly Payment[];
  usage: Usage;
  nextCharge: NextCharge;
}>;

export type LoginRequest = Readonly<{ loginId: string; password: string }>;

/** 자동결제 동의. 카드 등록 전에 서버에 먼저 저장합니다. */
export type ConsentRequest = Readonly<{
  termsVersion: string;
  autopayAgreed: boolean;
  notificationEmail: string;
}>;

/** 동의를 저장한 뒤 서버가 발급하는 1회용 구매자 식별키. */
export type AuthSession = Readonly<{ customerKey: string }>;

export type BillingKeyIssueRequest = Readonly<{ customerKey: string; authKey: string }>;

export type CardRegistrationRequest = Readonly<{
  customerKey: string;
  cardNumber: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  customerIdentityNumber: string;
  cardPassword: string;
}>;

export type BillingApi = Readonly<{
  login: (input: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
  /** 로그인하지 않았으면 `null`입니다. */
  getMe: () => Promise<User | null>;
  getCheckout: () => Promise<Checkout>;
  getBilling: () => Promise<Billing>;
  createAuthSession: (consent: ConsentRequest) => Promise<AuthSession>;
  issueBillingKey: (input: BillingKeyIssueRequest) => Promise<PaymentMethod>;
  registerCard: (input: CardRegistrationRequest) => Promise<PaymentMethod>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  startSubscription: () => Promise<Subscription>;
  cancelSubscription: () => Promise<Subscription>;
  payOverdue: () => Promise<Subscription>;
}>;
