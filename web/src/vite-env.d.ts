/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 토스페이먼츠 API 개별 연동 클라이언트 키(test_ck_ 또는 live_ck_). 시크릿 키는 넣지 않습니다. */
  readonly VITE_TOSS_CLIENT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
