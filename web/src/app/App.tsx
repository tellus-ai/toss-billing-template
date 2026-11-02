import { createBrowserRouter, RouterProvider } from 'react-router';
import { RequireLogin, SessionProvider } from '../auth/session';
import { SiteLayout } from '../components/SiteLayout';
import { BillingPage } from '../pages/billing/BillingPage';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PaymentMethodCallbackPage } from '../pages/payment-method/PaymentMethodCallbackPage';
import { PaymentMethodPage } from '../pages/payment-method/PaymentMethodPage';
import { PrivacyPage } from '../pages/policies/PrivacyPage';
import { RefundPage } from '../pages/policies/RefundPage';
import { TermsPage } from '../pages/policies/TermsPage';
import { SubscribePage } from '../pages/SubscribePage';
import { TossExamplePage } from '../pages/TossExamplePage';
import { AppServicesProvider, type AppServices } from './app-services';

/**
 * 공개 화면(랜딩, 로그인, 정책 문서)은 로그인 없이 열려야 심사 담당자가 확인할 수 있습니다.
 * 결제 화면만 RequireLogin 아래에 둡니다.
 */
const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/policies/terms', element: <TermsPage /> },
      { path: '/policies/refund', element: <RefundPage /> },
      { path: '/policies/privacy', element: <PrivacyPage /> },
      // 개발 확인용입니다. 심사 전에 이 경로와 TossExamplePage를 지우세요.
      { path: '/toss-example', element: <TossExamplePage /> },
      {
        element: <RequireLogin />,
        children: [
          { path: '/subscribe', element: <SubscribePage /> },
          { path: '/payment-method', element: <PaymentMethodPage /> },
          { path: '/payment-method/callback', element: <PaymentMethodCallbackPage /> },
          { path: '/billing', element: <BillingPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App({ services }: Readonly<{ services: AppServices }>) {
  return (
    <AppServicesProvider services={services}>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </AppServicesProvider>
  );
}
