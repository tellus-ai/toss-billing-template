/**
 * 결제 후 다음 결제일을 정합니다.
 *
 * 직전 결제일에 한 달을 더하지 않고 최초 결제일(`anchorDay`)로 돌아갑니다. 1월 31일에 시작한 구독은
 * 2월 28일 다음에 3월 31일로 돌아옵니다. 그 달에 없는 날은 말일로 맞추고 시각은 유지합니다.
 */
export function nextBillingDate(dueAt: Date, anchorDay: number): Date {
  const targetMonth = dueAt.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(dueAt.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();
  const next = new Date(dueAt);
  next.setUTCFullYear(dueAt.getUTCFullYear(), targetMonth, Math.min(anchorDay, lastDay));
  return next;
}
