import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { userMessageOf } from '../../api/api-error';
import { useAppServices } from '../../app/app-services';
import { useSignedInUser } from '../../auth/session';
import { isNotificationEmail } from '../../billing/notification-email';
import { siteConfig } from '../../config';
import { autopayConsentItems } from '../../content/consent-items';
import { requestCardBillingAuth } from '../../toss/billing-auth';

const CALLBACK_PATH = '/payment-method/callback';
const CONSENT_ITEMS = autopayConsentItems(siteConfig.plan);

type Request = Readonly<{ kind: 'idle' }> | Readonly<{ kind: 'sending' }> | Readonly<{ kind: 'failed'; message: string }>;

/**
 * 자동결제 동의. 일반 약관 동의와 별도로 받고, 기본값은 해제입니다.
 *
 * 동의는 카드 등록 전에 서버에 먼저 저장합니다. 브라우저를 거쳐 돌아온 동의 값은 위변조를 막을 수 없기 때문입니다.
 */
export function ConsentStep({ onCardFormChosen }: Readonly<{ onCardFormChosen: (customerKey: string) => void }>) {
  const { api, previewMode, tossClientKey } = useAppServices();
  const user = useSignedInUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user.email ?? '');
  const [agreed, setAgreed] = useState(false);
  const [request, setRequest] = useState<Request>({ kind: 'idle' });
  const emailValid = isNotificationEmail(email);
  const disabled = !emailValid || !agreed || request.kind === 'sending';

  function saveConsent() {
    return api.createAuthSession({ termsVersion: siteConfig.policy.termsVersion, autopayAgreed: agreed, notificationEmail: email });
  }

  async function openTossWindow() {
    if (tossClientKey === null && !previewMode) {
      setRequest({ kind: 'failed', message: '토스 클라이언트 키(VITE_TOSS_CLIENT_KEY)가 설정되지 않았습니다.' });
      return;
    }
    setRequest({ kind: 'sending' });
    try {
      const { customerKey } = await saveConsent();
      if (tossClientKey === null) {
        // 키가 없는 미리보기에서는 결제창을 건너뛰고 인증에 성공해 돌아온 것처럼 이동합니다.
        navigate(`${CALLBACK_PATH}?customerKey=${customerKey}&authKey=preview`);
        return;
      }
      const callbackUrl = new URL(CALLBACK_PATH, window.location.origin).href;
      const failure = await requestCardBillingAuth({
        clientKey: tossClientKey,
        customerKey,
        successUrl: callbackUrl,
        failUrl: callbackUrl,
        customerEmail: email,
        customerName: user.name,
      });
      setRequest({ kind: 'failed', message: `토스 결제창을 열지 못했습니다. (${failure.code})` });
    } catch (error: unknown) {
      setRequest({ kind: 'failed', message: userMessageOf(error) });
    }
  }

  async function chooseCardForm() {
    setRequest({ kind: 'sending' });
    try {
      onCardFormChosen((await saveConsent()).customerKey);
    } catch (error: unknown) {
      setRequest({ kind: 'failed', message: userMessageOf(error) });
    }
  }

  return (
    <section className="stack">
      <div>
        <p className="steps-label">1단계 / 2단계</p>
        <h1 className="page-title">자동결제 동의</h1>
        <p className="page-lead">동의 내용을 확인하고 카드 등록 방식을 선택해 주세요.</p>
      </div>

      <section className="card field">
        <label htmlFor="notification-email">결제 안내 이메일</label>
        <input
          className="input"
          id="notification-email"
          type="email"
          autoComplete="email"
          placeholder="이메일을 입력해 주세요"
          value={email}
          aria-invalid={!emailValid && email !== ''}
          onChange={(event) => setEmail(event.target.value)}
        />
        <p className="hint">구독료와 추가 사용료의 결제 성공·실패를 이 주소로 알려드립니다.</p>
        {!emailValid && email !== '' && (
          <p className="error" role="alert">
            결제 안내를 받을 이메일 주소를 정확히 입력해 주세요.
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="consent-title">
        <label className="check consent-head">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <span id="consent-title">
            <em>필수</em> 자동결제 조건을 모두 확인했으며 이에 동의합니다.
          </span>
        </label>
        <dl className="consent-list" aria-label="자동결제 동의 항목">
          {CONSENT_ITEMS.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
        </dl>
        <p className="hint" style={{ marginTop: 8 }}>
          <Link to="/policies/terms" target="_blank">이용약관</Link> · <Link to="/policies/refund" target="_blank">취소·환불 규정</Link> ·{' '}
          <Link to="/policies/privacy" target="_blank">개인정보처리방침</Link>
        </p>
      </section>

      {request.kind === 'failed' && (
        <p className="error" role="alert">
          {request.message}
        </p>
      )}
      <div className="button-pair">
        <button className="btn btn-primary" type="button" disabled={disabled} onClick={() => void openTossWindow()}>
          토스 결제창으로 등록
        </button>
        <button className="btn btn-outline" type="button" disabled={disabled} onClick={() => void chooseCardForm()}>
          카드 정보 직접 입력
        </button>
      </div>
    </section>
  );
}
