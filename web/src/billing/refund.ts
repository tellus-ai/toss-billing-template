/**
 * 즉시 해지 환불 계산.
 *
 * 토스페이먼츠는 무형 서비스의 경우 제공이 시작되지 않은 부분을 일할 계산으로 환불하도록 요구합니다.
 * 위약금을 두려면 법무 검토와 토스 계약 담당자 확인을 먼저 받으세요.
 */
export type ImmediateRefundInput = Readonly<{
  /** 해당 이용 기간에 결제한 구독료(부가세 포함). */
  paidAmount: number;
  /** 이용 기간의 전체 일수. */
  periodDays: number;
  /** 해지 요청일 다음 날부터 이용 기간 끝까지의 일수. */
  remainingDays: number;
  /** 미납금과 아직 청구하지 않은 추가 사용료의 합. */
  deductions: number;
}>;

/** 결제 금액을 이용 기간 일수로 나누어 남은 일수를 곱합니다. 원 미만은 버립니다. */
export function remainingPeriodAmount({ paidAmount, periodDays, remainingDays }: ImmediateRefundInput): number {
  return Math.floor((paidAmount * remainingDays) / periodDays);
}

/** 즉시 해지 환불액. 남은 기간 금액에서 공제액을 뺍니다. 0원 아래로 내려가지 않습니다. */
export function immediateRefundAmount(input: ImmediateRefundInput): number {
  return Math.max(0, remainingPeriodAmount(input) - input.deductions);
}
