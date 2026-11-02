export const DEFAULT_PATH_AFTER_LOGIN = '/billing';

/** 슬래시 하나로 시작하는 사이트 내부 경로만 허용합니다. 외부 주소로 보내면 피싱에 악용됩니다. */
const INTERNAL_PATH = /^\/(?![/\\])[\w\-/]*(\?[\w=&-]*)?$/;

/** 로그인 뒤 돌아갈 경로를 정합니다. 내부 경로가 아니면 구독 관리로 보냅니다. */
export function safeNextPath(next: string | null): string {
  return next !== null && INTERNAL_PATH.test(next) ? next : DEFAULT_PATH_AFTER_LOGIN;
}
