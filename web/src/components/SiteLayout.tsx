import { Link, Outlet, ScrollRestoration, useNavigate } from 'react-router';
import { useAppServices } from '../app/app-services';
import { useSession } from '../auth/session';
import { siteConfig } from '../config';
import { ConfigText } from './ConfigText';
import { SiteFooter } from './SiteFooter';

/** 모든 화면이 공유하는 머리글과 푸터. 로그인 화면과 정책 문서에도 푸터가 보여야 심사에서 확인할 수 있습니다. */
export function SiteLayout() {
  const { previewMode } = useAppServices();

  return (
    <>
      {previewMode && (
        <p className="ribbon" role="status">
          <strong>템플릿 미리보기</strong>
          실제 로그인과 결제가 일어나지 않습니다. 실제 카드 정보를 입력하지 마세요.
        </p>
      )}
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <ScrollRestoration />
    </>
  );
}

function SiteHeader() {
  const { state, signOut } = useSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" to="/">
          <ConfigText value={siteConfig.service.name} />
        </Link>
        <nav aria-label="주요 메뉴" className="site-nav">
          <Link to="/#pricing">요금제</Link>
          <Link to="/billing">구독 관리</Link>
          {state.kind === 'signed_in' ? (
            <button type="button" onClick={() => void handleSignOut()}>
              로그아웃
            </button>
          ) : (
            <Link to="/login">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
