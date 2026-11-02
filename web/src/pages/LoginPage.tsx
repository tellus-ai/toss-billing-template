import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { userMessageOf } from '../api/api-error';
import { useAppServices } from '../app/app-services';
import { safeNextPath } from '../auth/safe-next-path';
import { useSession } from '../auth/session';
import { ConfigText } from '../components/ConfigText';
import { siteConfig } from '../config';

type Submission = Readonly<{ kind: 'idle' }> | Readonly<{ kind: 'submitting' }> | Readonly<{ kind: 'failed'; message: string }>;

/** 운영 서버의 실제 로그인. 심사 담당자가 이 화면으로 결제 경로까지 들어갑니다. */
export function LoginPage() {
  const { api, previewMode } = useAppServices();
  const { state, signIn } = useSession();
  const [searchParams] = useSearchParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submission, setSubmission] = useState<Submission>({ kind: 'idle' });
  const passwordRef = useRef<HTMLInputElement>(null);

  // 로그인이 끝나면 세션이 바뀌어 원래 보던 화면으로 돌아갑니다.
  if (state.kind === 'signed_in') return <Navigate to={safeNextPath(searchParams.get('next'))} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission({ kind: 'submitting' });
    try {
      signIn(await api.login({ loginId: loginId.trim(), password }));
    } catch (error: unknown) {
      setPassword('');
      setSubmission({ kind: 'failed', message: userMessageOf(error) });
      passwordRef.current?.focus();
    }
  }

  const submitting = submission.kind === 'submitting';

  return (
    <main className="login-wrap">
      <form className="login-card" noValidate aria-labelledby="login-title" onSubmit={(event) => void handleSubmit(event)}>
        <header>
          <h1 id="login-title">
            <ConfigText value={siteConfig.service.name} /> 로그인
          </h1>
          <p>구독과 결제는 로그인 후 이용할 수 있습니다.</p>
        </header>

        <div className="stack">
          <div className="field">
            <label htmlFor="login-id">아이디</label>
            <input
              className="input"
              id="login-id"
              autoComplete="username"
              placeholder="아이디 입력"
              value={loginId}
              onChange={(event) => {
                setLoginId(event.target.value);
                setSubmission({ kind: 'idle' });
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <div className="input-with-action">
              <input
                ref={passwordRef}
                className="input"
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSubmission({ kind: 'idle' });
                }}
              />
              <button type="button" aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)}>
                {passwordVisible ? '숨기기' : '보기'}
              </button>
            </div>
          </div>
        </div>

        <div className="stack">
          {submission.kind === 'failed' && (
            <p className="error" role="alert">
              {submission.message}
            </p>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting || loginId.trim() === '' || password === ''}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
          <p className="login-help">
            아이디나 비밀번호를 잊으셨다면 고객센터(<ConfigText value={siteConfig.company.email} />)로 문의해 주세요.
          </p>
          {previewMode && (
            <p className="notice">
              <strong>미리보기 계정</strong> 아이디 <code>{siteConfig.previewAccount.loginId}</code> / 비밀번호{' '}
              <code>{siteConfig.previewAccount.password}</code>
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
