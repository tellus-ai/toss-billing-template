import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { userMessageOf } from '../api/api-error';
import type { Checkout, PaymentMethod, Subscription } from '../api/types';
import { useAppServices } from '../app/app-services';
import { useLoad } from '../app/use-load';
import { formatDate, formatWon } from '../billing/format';
import { ConfigText } from '../components/ConfigText';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadStatus } from '../components/LoadStatus';
import { siteConfig } from '../config';
import { RefundSummary } from './RefundSummary';

/** 결제 직전 화면. 회원이 결제 전에 알아야 할 내용을 한 화면에 모두 보여줍니다. */
export function SubscribePage() {
  const { api } = useAppServices();
  const { state } = useLoad(api.getCheckout);

  return (
    <main className="page">
      <h1 className="page-title">구독 결제</h1>
      <p className="page-lead">결제 내용을 확인해 주세요. 구독을 시작하면 매월 자동으로 결제됩니다.</p>
      {state.kind !== 'ready' ? (
        <div style={{ marginTop: 24 }}>
          <LoadStatus state={state} />
        </div>
      ) : state.data.subscription !== null ? (
        <section className="card empty" style={{ marginTop: 24 }}>
          <p>이미 구독 중입니다.</p>
          <Link className="btn btn-primary" to="/billing">
            구독 관리로 이동
          </Link>
        </section>
      ) : (
        <div className="checkout">
          <div className="stack">
            <OrderSummary checkout={state.data} />
            <section className="notice" aria-labelledby="refund-summary-title">
              <strong id="refund-summary-title">취소·환불 안내</strong>
              <RefundSummary includeRetry />
              <p style={{ marginTop: 8 }}>
                <Link to="/policies/refund" target="_blank">
                  취소·환불 규정 전문
                </Link>
              </p>
            </section>
          </div>
          <PaymentPanel checkout={state.data} />
        </div>
      )}
    </main>
  );
}

function OrderSummary({ checkout }: Readonly<{ checkout: Checkout }>) {
  const { plan } = siteConfig;
  return (
    <section className="card" aria-labelledby="order-title">
      <h2 className="section-title" id="order-title">
        주문 내용
      </h2>
      <dl className="rows">
        <div>
          <dt>상품</dt>
          <dd>
            <ConfigText value={plan.name} />
          </dd>
        </div>
        <div>
          <dt>제공량</dt>
          <dd>
            월 {plan.includedUnits}
            {plan.unitLabel}
          </dd>
        </div>
        <div>
          <dt>이용 기간</dt>
          <dd>
            {formatDate(checkout.startsAt)} ~ {formatDate(checkout.nextBillingAt)} 전날
          </dd>
        </div>
        <div>
          <dt>결제 주기</dt>
          <dd>매월 {new Date(checkout.startsAt).getDate()}일 자동결제</dd>
        </div>
        <div>
          <dt>다음 결제 예정일</dt>
          <dd>{formatDate(checkout.nextBillingAt)}</dd>
        </div>
        <div>
          <dt>추가 사용료</dt>
          <dd>
            1{plan.unitLabel}당 {formatWon(plan.overageUnitAmount)}
            <small>다음 결제일에 구독료와 합산 청구</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}

type Payment = Readonly<{ kind: 'idle' }> | Readonly<{ kind: 'paying' }> | Readonly<{ kind: 'paid'; subscription: Subscription }> | Readonly<{ kind: 'failed'; message: string }>;

function PaymentPanel({ checkout }: Readonly<{ checkout: Checkout }>) {
  const { api } = useAppServices();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [payment, setPayment] = useState<Payment>({ kind: 'idle' });
  const { quote, paymentMethod } = checkout;

  async function handlePay() {
    setPayment({ kind: 'paying' });
    try {
      setPayment({ kind: 'paid', subscription: await api.startSubscription() });
    } catch (error: unknown) {
      setPayment({ kind: 'failed', message: userMessageOf(error) });
    }
  }

  return (
    <aside className="checkout-side">
      <section className="card stack" aria-labelledby="payment-title">
        <h2 className="section-title" id="payment-title">
          결제 금액
        </h2>
        <PaymentMethodSummary paymentMethod={paymentMethod} />
        <dl className="rows">
          <div>
            <dt>공급가액</dt>
            <dd>{formatWon(quote.supplyAmount)}</dd>
          </div>
          <div>
            <dt>부가세</dt>
            <dd>{formatWon(quote.vatAmount)}</dd>
          </div>
        </dl>
        <p className="total">
          <span>오늘 결제 금액</span>
          <strong>{formatWon(quote.totalAmount)}</strong>
        </p>

        {paymentMethod === null ? (
          <Link className="btn btn-primary btn-block" to="/payment-method">
            카드 등록하기
          </Link>
        ) : (
          <>
            <label className="check">
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              <span>위 결제 내용과 매월 자동결제되는 조건을 확인했으며 결제에 동의합니다.</span>
            </label>
            {payment.kind === 'failed' && (
              <p className="error" role="alert">
                {payment.message}
              </p>
            )}
            <button
              className="btn btn-primary btn-block"
              type="button"
              disabled={!agreed || payment.kind === 'paying' || payment.kind === 'paid'}
              onClick={() => void handlePay()}
            >
              {payment.kind === 'paying' ? '결제 승인 중...' : `${formatWon(quote.totalAmount)} 결제하고 구독 시작`}
            </button>
          </>
        )}
      </section>

      <ConfirmDialog
        open={payment.kind === 'paid'}
        title="구독이 시작되었습니다"
        confirmLabel="구독 관리로 이동"
        onConfirm={() => navigate('/billing')}
        onCancel={() => navigate('/billing')}
      >
        {payment.kind === 'paid' && <p>다음 결제일은 {formatDate(payment.subscription.nextBillingAt)}입니다.</p>}
      </ConfirmDialog>
    </aside>
  );
}

function PaymentMethodSummary({ paymentMethod }: Readonly<{ paymentMethod: PaymentMethod | null }>) {
  if (paymentMethod === null) {
    return (
      <div className="notice notice-warning">
        <strong>등록된 카드가 없습니다.</strong> 자동결제에 동의하고 카드를 등록하면 결제할 수 있습니다.
      </div>
    );
  }
  return (
    <div className="pay-method">
      <span>
        {paymentMethod.cardCompany} {paymentMethod.maskedNumber}
      </span>
      <Link className="btn btn-secondary btn-small" to="/billing">
        변경
      </Link>
    </div>
  );
}
