import type { NextCharge, Subscription, Usage } from '../../api/types';
import { formatDate, formatWon } from '../../billing/format';
import { ConfigText } from '../../components/ConfigText';

type SubscriptionSummaryProps = Readonly<{ subscription: Subscription; usage: Usage; nextCharge: NextCharge }>;

/** 구독 상태와 다음 결제 예정 금액. 해지 예약 중이면 구독료 대신 남은 추가 사용료만 청구됩니다. */
export function SubscriptionSummary({ subscription, usage, nextCharge }: SubscriptionSummaryProps) {
  const cancelAt = subscription.cancelAt;
  const usagePercent = Math.min(100, (usage.usedUnits / usage.includedUnits) * 100);

  return (
    <div className="summary-grid">
      <section className="card" aria-labelledby="plan-title">
        <div className="section-head">
          <h2 className="section-title" id="plan-title">
            구독 상태
          </h2>
          <span className={cancelAt === null ? 'badge badge-success' : 'badge badge-danger'}>{cancelAt === null ? '이용 중' : '해지 예약'}</span>
        </div>
        <dl className="rows">
          <div>
            <dt>요금제</dt>
            <dd>
              <ConfigText value={subscription.planName} />
            </dd>
          </div>
          <div>
            <dt>구독 시작일</dt>
            <dd>{formatDate(subscription.startedAt)}</dd>
          </div>
          <div>
            <dt>{cancelAt === null ? '다음 결제일' : '이용 종료일'}</dt>
            <dd>{formatDate(cancelAt ?? subscription.nextBillingAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="card" aria-labelledby="charge-title">
        <h2 className="section-title" id="charge-title">
          다음 결제 예정 금액
        </h2>
        <dl className="rows">
          <div>
            <dt>구독료</dt>
            <dd>{formatWon(cancelAt === null ? nextCharge.subscriptionAmount : 0)}</dd>
          </div>
          <div>
            <dt>추가 사용료</dt>
            <dd>
              {formatWon(nextCharge.overageAmount)}
              <small>
                {usage.usedUnits}
                {usage.unitLabel} 사용 / {usage.includedUnits}
                {usage.unitLabel} 제공
              </small>
            </dd>
          </div>
        </dl>
        <div className="usage-bar" aria-hidden="true">
          <span style={{ width: `${usagePercent}%` }} />
        </div>
        <p className="total" style={{ marginTop: 16 }}>
          <span>합계 (부가세 포함)</span>
          <strong>{formatWon(cancelAt === null ? nextCharge.totalAmount : nextCharge.overageAmount)}</strong>
        </p>
      </section>
    </div>
  );
}
