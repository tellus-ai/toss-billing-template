import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPreviewApi } from './api/preview-api';
import { createServerApi } from './api/server-api';
import { App } from './app/App';
import { siteConfig } from './config';
import './styles.css';

// 실행 모드는 명령으로 정합니다. `npm run dev`와 `npm run build:preview`만 미리보기이고, 나머지는 실제 서버를 호출합니다.
const previewMode = import.meta.env.MODE === 'preview';
const rawTossClientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
const tossClientKey = rawTossClientKey === undefined || rawTossClientKey === '' ? null : rawTossClientKey;

const api = previewMode
  ? createPreviewApi({
      storage: window.sessionStorage,
      now: () => new Date(),
      newId: () => crypto.randomUUID().replaceAll('-', ''),
      account: siteConfig.previewAccount,
      plan: siteConfig.plan,
    })
  : createServerApi({ baseUrl: siteConfig.apiBaseUrl, fetchFn: window.fetch.bind(window) });

const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('index.html에 #root 요소가 없습니다.');

createRoot(rootElement).render(
  <StrictMode>
    <App services={{ api, previewMode, tossClientKey }} />
  </StrictMode>,
);
