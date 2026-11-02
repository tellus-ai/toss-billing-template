/** 원 단위 금액을 `33,000원`처럼 표시합니다. */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** ISO 8601 시각을 `2026년 11월 2일`처럼 표시합니다. */
export function formatDate(isoDateTime: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date(isoDateTime));
}

/** ISO 8601 시각을 `2026. 11. 2. 오전 10:04`처럼 표시합니다. */
export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoDateTime));
}
