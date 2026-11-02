/** 취소·환불 요약. 랜딩과 결제 직전 화면에 같은 문구를 보여줍니다. 전문은 정책 문서에 있습니다. */
export function RefundSummary({ includeRetry = false }: Readonly<{ includeRetry?: boolean }>) {
  return (
    <ul>
      <li>결제일부터 7일 이내에 이용 내역이 없으면 전액 환불합니다.</li>
      <li>기간 종료 해지는 환불 없이 결제한 기간의 마지막 날까지 이용합니다.</li>
      <li>즉시 해지는 남은 기간을 일할 계산한 금액에서 미납금과 추가 사용료를 뺀 금액을 환불합니다.</li>
      {includeRetry && <li>결제에 실패하면 결제일로부터 1일, 3일, 7일째에 다시 시도하며 7일째까지 실패하면 이용이 제한됩니다.</li>}
    </ul>
  );
}
