import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAppServices } from '../app/app-services';
import { siteConfig } from '../config';
import { checkClientKey, readBillingAuthCallback, requestCardBillingAuth, type ClientKeyCheck } from '../toss/billing-auth';

const EXAMPLE_PATH = '/toss-example';

const KEY_PROBLEMS: Readonly<Record<Exclude<ClientKeyCheck['kind'], 'test'>, string>> = {
  live: '이 예제는 테스트 키만 사용합니다.',
  widget_key: '결제위젯 키(gck)로는 빌링키를 발급할 수 없습니다. API 개별 연동 키(ck)를 입력해 주세요.',
  secret_key: '시크릿 키는 브라우저에 입력하면 안 됩니다. 클라이언트 키(ck)를 입력해 주세요.',
  unknown_format: 'test_ck_로 시작하는 테스트 클라이언트 키를 입력해 주세요.',
};

const SDK_CODE = `import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

const tossPayments = await loadTossPayments(clientKey);
await tossPayments.payment({ customerKey }).requestBillingAuth({
  method: 'CARD',
  successUrl: 'https://내도메인/payment-method/callback',
  failUrl: 'https://내도메인/payment-method/callback',
  customerEmail: 'customer@example.com',
  customerName: '홍길동',
});`;

/** 테스트 키로 토스 결제창을 실제로 열어 보는 개발용 화면입니다. 운영에 배포하지 마세요. */
export function TossExamplePage() {
  const [searchParams] = useSearchParams();
  const callback = readBillingAuthCallback(searchParams);

  return (
    <main className="page page-narrow stack">
      <div>
        <h1 className="page-title">토스페이먼츠 연동 예제</h1>
        <p className="page-lead">테스트 키로 결제창을 실제로 열고, 돌아온 값으로 서버가 호출할 명령을 확인합니다. 이 화면은 개발용이므로 운영에 배포하지 마세요.</p>
      </div>
      {callback.kind === 'authorized' ? (
        <IssueCommands customerKey={callback.customerKey} authKey={callback.authKey} />
      ) : callback.kind === 'failed' ? (
        <section className="card example-step">
          <h2>
            결제창에서 돌아왔습니다 <span className="badge badge-danger">인증 실패</span>
          </h2>
          <dl className="rows">
            <div>
              <dt>code</dt>
              <dd className="mono">{callback.code}</dd>
            </div>
            <div>
              <dt>message</dt>
              <dd>{callback.message}</dd>
            </div>
          </dl>
          <Link className="btn btn-secondary" to={EXAMPLE_PATH}>
            처음으로
          </Link>
        </section>
      ) : (
        <OpenWindowStep />
      )}
      <section className="card example-step">
        <h2>결제창을 여는 코드</h2>
        <pre>
          <code>{SDK_CODE}</code>
        </pre>
      </section>
    </main>
  );
}

function OpenWindowStep() {
  const { tossClientKey } = useAppServices();
  const [clientKey, setClientKey] = useState(tossClientKey ?? '');
  const [customerKey, setCustomerKey] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function openWindow() {
    const check = checkClientKey(clientKey.trim());
    if (check.kind !== 'test') {
      setProblem(KEY_PROBLEMS[check.kind]);
      return;
    }
    // 실제 서비스에서는 서버가 자동결제 동의를 저장한 뒤 만듭니다.
    const nextCustomerKey = `cus_${crypto.randomUUID().replaceAll('-', '')}`;
    setCustomerKey(nextCustomerKey);
    setProblem(null);
    const backUrl = new URL(EXAMPLE_PATH, window.location.origin).href;
    const failure = await requestCardBillingAuth({
      clientKey: clientKey.trim(),
      customerKey: nextCustomerKey,
      successUrl: backUrl,
      failUrl: backUrl,
      customerEmail: 'customer@example.com',
      customerName: '테스트 구매자',
    });
    setProblem(`결제창을 열지 못했습니다 (${failure.code}: ${failure.message}). 자동결제 계약이 된 상점의 API 개별 연동 키인지 확인해 주세요.`);
  }

  return (
    <section className="card example-step">
      <h2>1. 테스트 클라이언트 키 입력</h2>
      <div className="field">
        <label htmlFor="client-key">클라이언트 키</label>
        <input className="input mono" id="client-key" placeholder="test_ck_..." spellCheck={false} autoComplete="off" value={clientKey} onChange={(event) => setClientKey(event.target.value)} />
        <p className="hint">
          개발자센터의 API 개별 연동 키에서 복사합니다. 시크릿 키(<code>test_sk_</code>)는 입력하지 마세요.
        </p>
      </div>
      <h2>2. 결제창 열기</h2>
      <p className="hint">
        버튼을 누르면 이 화면이 서버 대신 구매자 식별키를 만들고 결제창을 엽니다. 테스트 환경에서는 카드 번호 앞 6자리(BIN)만 유효해도 등록되고, 본인인증 창에는{' '}
        <code>000000</code>을 입력합니다. 실제 청구는 일어나지 않습니다.
      </p>
      {customerKey !== null && <p className="mono">customerKey: {customerKey}</p>}
      {problem !== null && (
        <p className="error" role="alert">
          {problem}
        </p>
      )}
      <button className="btn btn-primary btn-block" type="button" onClick={() => void openWindow()}>
        테스트 결제창 열기
      </button>
    </section>
  );
}

const shellQuote = (text: string) => `'${text.replaceAll("'", `'\\''`)}'`;

/** 결제창에서 받은 값으로 서버가 실행할 명령. 시크릿 키는 터미널 환경변수로만 다룹니다. */
function IssueCommands({ customerKey, authKey }: Readonly<{ customerKey: string; authKey: string }>) {
  const [orderId] = useState(() => `renew_${customerKey.slice(-12)}`);
  const issueCommand = [
    'export TOSS_SECRET_KEY=test_sk_여기에_시크릿키',
    '',
    'curl -X POST https://api.tosspayments.com/v1/billing/authorizations/issue \\',
    '  -u "$TOSS_SECRET_KEY:" \\',
    "  -H 'Content-Type: application/json' \\",
    `  -d ${shellQuote(JSON.stringify({ authKey, customerKey }))}`,
  ].join('\n');
  const chargeCommand = [
    'export BILLING_KEY=응답의_billingKey',
    '',
    'curl -X POST "https://api.tosspayments.com/v1/billing/$BILLING_KEY" \\',
    '  -u "$TOSS_SECRET_KEY:" \\',
    "  -H 'Content-Type: application/json' \\",
    `  -H 'Idempotency-Key: ${orderId}' \\`,
    `  -d ${shellQuote(JSON.stringify({ customerKey, orderId, orderName: `${siteConfig.plan.name} 정기 결제`, amount: siteConfig.plan.monthlyAmount }))}`,
  ].join('\n');

  return (
    <section className="card example-step">
      <h2>
        3. 결제창에서 돌아왔습니다 <span className="badge badge-success">인증 성공</span>
      </h2>
      <dl className="rows">
        <div>
          <dt>customerKey</dt>
          <dd className="mono">{customerKey}</dd>
        </div>
        <div>
          <dt>authKey</dt>
          <dd className="mono">{authKey}</dd>
        </div>
      </dl>
      <p className="hint">authKey는 일회성입니다. 서버가 시크릿 키로 빌링키를 발급합니다.</p>
      <pre>
        <code id="issue-command">{issueCommand}</code>
      </pre>
      <h2>4. 빌링키로 결제 승인</h2>
      <p className="hint">
        위 명령 응답의 <code>billingKey</code>를 환경변수에 넣고 실행합니다. 금액은 서버가 정합니다.
      </p>
      <pre>
        <code>{chargeCommand}</code>
      </pre>
      <Link className="btn btn-secondary" to={EXAMPLE_PATH}>
        처음으로
      </Link>
    </section>
  );
}
