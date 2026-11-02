/** 결제 안내를 받을 수 있는 이메일 주소인지 확인합니다. 서버도 같은 기준으로 검사해야 합니다. */
export function isNotificationEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(email);
}
