import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { userMessageOf } from '../../api/api-error';
import type { Billing } from '../../api/types';
import { useAppServices } from '../../app/app-services';
import { useLoad } from '../../app/use-load';
import { formatDate } from '../../billing/format';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LoadStatus } from '../../components/LoadStatus';
import { PaymentHistory } from './PaymentHistory';
import { PaymentMethodList } from './PaymentMethodList';
import { SubscriptionSummary } from './SubscriptionSummary';

type PendingConfirmation = Readonly<{ kind: 'delete_card'; paymentMethodId: string }> | Readonly<{ kind: 'cancel_subscription' }>;

/** 구독 상태, 다음 결제 예정 금액, 결제 수단, 결제 내역을 보여주고 해지를 받습니다. */
export function BillingPage() {
  const { api } = useAppServices();
  const { state, reload } = useLoad(api.getBilling);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  /** 변경 요청을 보내고 다시 불러옵니다. 실패하면 서버가 준 문구를 보여줍니다. */
  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      reload();
    } catch (error: unknown) {
      setActionError(userMessageOf(error));
    }
  }

  async function confirmPending() {
    if (pending === null) return;
    setPending(null);
    await run(() => (pending.kind === 'delete_card' ? api.deletePaymentMethod(pending.paymentMethodId) : api.cancelSubscription()));
  }

  return (
    <main className="page">
      <h1 className="page-title">구독 관리</h1>
      <p className="page-lead">구독 상태, 결제 수단, 결제 내역을 확인하고 해지할 수 있습니다.</p>
      {actionError !== null && (
        <p className="notice notice-danger" role="alert" style={{ marginTop: 20 }}>
          {actionError}
        </p>
      )}
      {state.kind === 'ready' ? (
        <BillingContent
          billing={state.data}
          onPayOverdue={() => void run(api.payOverdue)}
          onSetDefault={(id) => void run(() => api.setDefaultPaymentMethod(id))}
          onDeleteCard={(id) => setPending({ kind: 'delete_card', paymentMethodId: id })}
          onCancelSubscription={() => setPending({ kind: 'cancel_subscription' })}
        />
      ) : (
        <div style={{ marginTop: 24 }}>
          <LoadStatus state={state} />
        </div>
      )}
      <ConfirmationDialog
        pending={pending}
        nextBillingAt={state.kind === 'ready' ? (state.data.subscription?.nextBillingAt ?? null) : null}
        onConfirm={() => void confirmPending()}
        onCancel={() => setPending(null)}
      />
    </main>
  );
}

type BillingContentProps = Readonly<{
  billing: Billing;
  onPayOverdue: () => void;
  onSetDefault: (paymentMethodId: string) => void;
  onDeleteCard: (paymentMethodId: string) => void;
  onCancelSubscription: () => void;
}>;

function BillingContent({ billing, onPayOverdue, onSetDefault, onDeleteCard, onCancelSubscription }: BillingContentProps) {
  const { previewMode } = useAppServices();
  const [searchParams] = useSearchParams();
  const { subscription } = billing;
  // 미리보기에서는 /billing?demo=past_due 로 미납 안내를 볼 수 있습니다.
  const pastDue = subscription?.status === 'PAST_DUE' || (previewMode && searchParams.get('demo') === 'past_due');

  return (
    <>
      {pastDue && (
        <section className="notice notice-danger" style={{ marginTop: 20 }}>
          <strong>구독료 결제에 실패했습니다.</strong> 결제일로부터 1일, 3일, 7일째에 다시 시도합니다. 7일째까지 결제되지 않으면 이용이
          제한됩니다.
          <p style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-small" type="button" onClick={onPayOverdue}>
              지금 결제하기
            </button>
          </p>
        </section>
      )}
      {subscription === null ? (
        <section className="card empty" style={{ marginTop: 24 }}>
          <p>구독 중인 요금제가 없습니다.</p>
          <Link className="btn btn-primary" to="/subscribe">
            구독 시작하기
          </Link>
        </section>
      ) : (
        <SubscriptionSummary subscription={subscription} usage={billing.usage} nextCharge={billing.nextCharge} />
      )}
      <PaymentMethodList paymentMethods={billing.paymentMethods} onSetDefault={onSetDefault} onDelete={onDeleteCard} />
      <PaymentHistory payments={billing.payments} />
      {subscription !== null && subscription.cancelAt === null && (
        <section style={{ marginTop: 16 }}>
          <button className="btn btn-danger-text" type="button" onClick={onCancelSubscription}>
            구독 해지
          </button>
        </section>
      )}
    </>
  );
}

type ConfirmationDialogProps = Readonly<{
  pending: PendingConfirmation | null;
  nextBillingAt: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}>;

function ConfirmationDialog({ pending, nextBillingAt, onConfirm, onCancel }: ConfirmationDialogProps) {
  const cancelling = pending?.kind === 'cancel_subscription';
  return (
    <ConfirmDialog
      open={pending !== null}
      title={cancelling ? '구독을 해지할까요?' : '카드를 삭제할까요?'}
      confirmLabel={cancelling ? '해지하기' : '삭제'}
      cancelLabel={cancelling ? '유지하기' : '취소'}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {cancelling ? (
        <>
          {nextBillingAt !== null && <p>{formatDate(nextBillingAt)} 전날까지 이용할 수 있고, 다음 결제일부터 구독료가 청구되지 않습니다.</p>}
          <p>이미 사용한 추가 사용료는 해지와 관계없이 청구될 수 있습니다.</p>
          <p>즉시 해지와 환불은 고객센터로 요청해 주세요.</p>
        </>
      ) : (
        <p>카드를 삭제해도 구독은 해지되지 않습니다. 등록된 카드가 없으면 다음 결제가 실패합니다.</p>
      )}
    </ConfirmDialog>
  );
}
