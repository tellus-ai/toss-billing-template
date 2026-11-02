import { formatWon } from '../../billing/format';
import { immediateRefundAmount, remainingPeriodAmount } from '../../billing/refund';
import { ConfigText } from '../../components/ConfigText';
import { siteConfig } from '../../config';

const { company, service, plan, policy } = siteConfig;

/** 계산 예시: 이용 기간 30일 중 20일이 남았고 미납금과 추가 사용료가 없는 경우. */
const EXAMPLE = {
  paidAmount: plan.monthlyAmount,
  periodDays: 30,
  remainingDays: 20,
  deductions: 0,
} as const;

/** 취소·환불 규정 초안. 화면의 환불 요약과 서버의 취소 금액 계산이 이 문서와 같아야 합니다. */
export function RefundPage() {
  const support = (
    <>
      <ConfigText value={company.tel} />, <ConfigText value={company.email} />
    </>
  );

  return (
    <main className="page">
      <article className="policy">
        <h1>취소·환불 규정</h1>
        <p className="policy-meta">
          시행일: <ConfigText value={policy.effectiveDate} /> · 버전: {policy.termsVersion}
        </p>

        <h2>1. 서비스 제공 방식</h2>
        <p>
          <ConfigText value={service.name} />은 온라인으로 제공되는 구독 서비스이며 별도로 배송되는 상품이 없습니다. 결제가 승인되면 즉시 이용할 수 있습니다.
        </p>

        <h2>2. 환불 기준 요약</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>조건</th>
                <th>환불 금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>청약 철회</td>
                <td>결제일부터 7일 이내이고 이용 내역이 없는 경우</td>
                <td>전액</td>
              </tr>
              <tr>
                <td>기간 종료 해지</td>
                <td>구독 관리 화면에서 해지한 경우</td>
                <td>환불 없음. 결제한 이용 기간의 마지막 날까지 이용</td>
              </tr>
              <tr>
                <td>즉시 해지</td>
                <td>이용 기간 중 서비스 종료와 환불을 요청한 경우</td>
                <td>남은 기간을 일할 계산한 금액 − 미납금 − 미청구 추가 사용료</td>
              </tr>
              <tr>
                <td>회사 귀책</td>
                <td>회사의 책임으로 서비스를 제공하지 못한 경우</td>
                <td>제공하지 못한 기간 금액 전액</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. 즉시 해지 환불 금액 계산</h2>
        <p>
          제공이 시작되지 않은 남은 기간은 일할 계산해 환불합니다. 남은 기간 금액은 해당 이용 기간에 결제한 구독료를 그 기간의 일수로 나누어 남은 일수를 곱한
          금액이며, 원 미만은 버립니다.
        </p>
        <p className="notice">
          <strong>계산 예시</strong> 구독료 {formatWon(EXAMPLE.paidAmount)}, 이용 기간 {EXAMPLE.periodDays}일, 남은 기간 {EXAMPLE.remainingDays}일, 미납금과 추가
          사용료가 없는 경우
          <br />
          {formatWon(EXAMPLE.paidAmount)} × {EXAMPLE.remainingDays}일 ÷ {EXAMPLE.periodDays}일 = 남은 기간 금액 {formatWon(remainingPeriodAmount(EXAMPLE))} → 환불 금액{' '}
          {formatWon(immediateRefundAmount(EXAMPLE))}
        </p>

        <h2>4. 추가 사용료</h2>
        <ol>
          <li>제공량을 넘겨 사용한 추가 사용료는 이미 제공된 서비스의 대가이므로 환불 대상이 아닙니다.</li>
          <li>회사의 오류로 잘못 청구된 추가 사용료는 전액 환불합니다.</li>
        </ol>

        <h2>5. 해지 방법</h2>
        <ol>
          <li>기간 종료 해지는 로그인 후 구독 관리 화면에서 언제든지 신청할 수 있습니다.</li>
          <li>
            즉시 해지와 환불은 고객센터({support})로 신청합니다. 운영시간: <ConfigText value={company.supportHours} />
          </li>
          <li>카드를 삭제하거나 카드가 만료된 것만으로는 구독이 해지되지 않습니다.</li>
        </ol>

        <h2>6. 환불 절차와 기간</h2>
        <ol>
          <li>회사는 환불 금액이 확정된 날부터 5영업일 이내에 원 결제수단으로 결제를 취소합니다.</li>
          <li>카드사 사정에 따라 취소 내역 반영까지 시간이 더 걸릴 수 있습니다.</li>
          <li>회사는 환불 금액과 공제 내역을 회원에게 이메일로 알립니다.</li>
        </ol>

        <h2>7. 결제 실패</h2>
        <p>
          결제일에 결제되지 않으면 결제일로부터 1일, 3일, 7일째에 다시 시도합니다. 7일째까지 결제되지 않으면 서비스 이용이 제한되고, 미납금을 결제하면 다시 이용할
          수 있습니다.
        </p>

        <h2>8. 법령과의 관계</h2>
        <p>이 규정은 관련 법령에서 정한 소비자의 권리를 제한하지 않습니다. 이 규정과 관련 법령의 강행규정이 다르면 법령을 따릅니다.</p>

        <h2>9. 문의</h2>
        <p>
          <ConfigText value={company.name} /> 고객센터 · {support} · <ConfigText value={company.supportHours} />
        </p>
      </article>
    </main>
  );
}
