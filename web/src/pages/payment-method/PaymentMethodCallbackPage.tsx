import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAppServices } from '../../app/app-services';
import { readBillingAuthCallback } from '../../toss/billing-auth';

type Issue = Readonly<{ kind: 'issuing' }> | Readonly<{ kind: 'registered' }> | Readonly<{ kind: 'failed' }>;

/** 토스 결제창에서 돌아온 화면. 인증값으로 빌링키 발급을 서버에 요청합니다. */
export function PaymentMethodCallbackPage() {
  const { api } = useAppServices();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // 주소를 지운 뒤에도 처음 받은 값을 쓰도록 첫 렌더링 때 한 번만 읽습니다.
  const [callback] = useState(() => readBillingAuthCallback(searchParams));
  const [issue, setIssue] = useState<Issue>({ kind: 'issuing' });
  const requestedRef = useRef(false);

  // authKey는 일회성이므로 주소창과 방문 기록에 남기지 않습니다.
  useEffect(() => {
    navigate(pathname, { replace: true });
  }, [navigate, pathname]);

  useEffect(() => {
    // authKey는 한 번만 쓸 수 있으므로 개발 모드에서 Effect가 다시 실행돼도 요청은 한 번만 보냅니다.
    if (callback.kind !== 'authorized' || requestedRef.current) return;
    requestedRef.current = true;
    api.issueBillingKey({ customerKey: callback.customerKey, authKey: callback.authKey }).then(
      () => setIssue({ kind: 'registered' }),
      (error: unknown) => {
        console.error(error);
        setIssue({ kind: 'failed' });
      },
    );
  }, [api, callback]);

  if (callback.kind !== 'authorized' || issue.kind === 'failed') {
    // 결제사 원문 메시지와 오류 코드는 사용자에게 보여주지 않습니다. 서버 로그에서 확인합니다.
    return <CallbackResult title="카드 등록에 실패했습니다" message="카드 정보를 확인하고 다시 시도해 주세요." linkLabel="다시 등록하기" linkTo="/payment-method" />;
  }
  if (issue.kind === 'issuing') {
    return <CallbackResult title="카드를 등록하는 중입니다" message="잠시만 기다려 주세요." />;
  }
  return <CallbackResult title="카드 등록이 완료되었습니다" message="이제 구독 결제를 진행할 수 있습니다." linkLabel="구독 결제로 이동" linkTo="/subscribe" />;
}

type CallbackResultProps = Readonly<{ title: string; message: string; linkLabel?: string; linkTo?: string }>;

function CallbackResult({ title, message, linkLabel, linkTo }: CallbackResultProps) {
  return (
    <main className="page page-narrow">
      <section className="card empty" aria-live="polite">
        <h1 className="section-title">{title}</h1>
        <p style={{ marginTop: 6 }}>{message}</p>
        {linkLabel !== undefined && linkTo !== undefined && (
          <Link className="btn btn-primary" to={linkTo}>
            {linkLabel}
          </Link>
        )}
      </section>
    </main>
  );
}
