import { createContext, useContext, type ReactNode } from 'react';
import type { BillingApi } from '../api/types';

/** 화면이 쓰는 외부 의존성. main.tsx가 실행 모드에 맞게 만들어 넣습니다. */
export type AppServices = Readonly<{
  api: BillingApi;
  /** `npm run dev`로 실행한 미리보기인지. 미리보기에서는 실제 로그인과 결제가 일어나지 않습니다. */
  previewMode: boolean;
  /** 토스 API 개별 연동 클라이언트 키. 설정하지 않았으면 `null`입니다. */
  tossClientKey: string | null;
}>;

const AppServicesContext = createContext<AppServices | null>(null);

export function AppServicesProvider({ services, children }: Readonly<{ services: AppServices; children: ReactNode }>) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (services === null) throw new Error('AppServicesProvider 안에서만 사용할 수 있습니다.');
  return services;
}
