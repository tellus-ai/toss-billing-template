import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CardForm } from './CardForm';
import { ConsentStep } from './ConsentStep';

type Step = Readonly<{ kind: 'consent' }> | Readonly<{ kind: 'card_form'; customerKey: string }>;

/** 1단계 자동결제 동의, 2단계 카드 등록. 토스 결제창을 고르면 결제창을 거쳐 콜백 화면으로 돌아옵니다. */
export function PaymentMethodPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>({ kind: 'consent' });
  const [registered, setRegistered] = useState(false);

  return (
    <main className="page page-narrow">
      {step.kind === 'consent' ? (
        <ConsentStep
          onCardFormChosen={(customerKey) => {
            setStep({ kind: 'card_form', customerKey });
            // 단계가 바뀌면 새 단계의 제목부터 보이게 합니다.
            window.scrollTo(0, 0);
          }}
        />
      ) : (
        <CardForm customerKey={step.customerKey} onRegistered={() => setRegistered(true)} />
      )}
      <ConfirmDialog
        open={registered}
        title="카드 등록이 완료되었습니다"
        confirmLabel="구독 결제로 이동"
        onConfirm={() => navigate('/subscribe')}
        onCancel={() => navigate('/subscribe')}
      >
        <p>이제 구독 결제를 진행할 수 있습니다.</p>
      </ConfirmDialog>
    </main>
  );
}
