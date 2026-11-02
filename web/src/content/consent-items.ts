import { formatWon } from '../billing/format';
import type { SiteConfig } from '../config';

export type ConsentItem = Readonly<{ label: string; detail: string }>;

/**
 * 자동결제 동의 화면에 표시하는 고지 항목.
 *
 * 이용약관 제8조의 7개 항목에 추가 사용료 합산과 결제 통지 수신처를 더했습니다.
 * 약관을 바꾸면 이 문구와 `policy.termsVersion`을 함께 바꿉니다.
 */
export function autopayConsentItems(plan: SiteConfig['plan']): readonly ConsentItem[] {
  return [
    {
      label: '정기 결제 금액과 산정 방식',
      detail: `월 ${formatWon(plan.monthlyAmount)}(부가세 포함)을 매 결제일에 결제합니다.`,
    },
    {
      label: '결제 주기와 결제 예정일',
      detail: '최초 결제일과 같은 날짜에 매월 1회 결제합니다. 해당 날짜가 없는 달은 말일에 결제합니다.',
    },
    { label: '자동 갱신', detail: '해지하지 않으면 매월 자동으로 갱신되며 등록한 카드로 결제됩니다.' },
    {
      label: '추가 사용료 합산 청구',
      detail: `월 제공량(${plan.includedUnits}${plan.unitLabel})을 넘겨 사용한 부분은 1${plan.unitLabel}당 ${formatWon(plan.overageUnitAmount)}(부가세 포함)으로 계산해 다음 결제일에 구독료와 합산 청구합니다.`,
    },
    { label: '결제수단 변경과 삭제 방법', detail: '구독 관리 화면에서 언제든지 카드를 추가·변경하거나 삭제할 수 있습니다.' },
    {
      label: '해지 방법과 적용 시점',
      detail: '구독 관리 화면에서 언제든지 해지할 수 있으며, 결제한 이용 기간의 마지막 날까지 이용할 수 있습니다.',
    },
    {
      label: '결제 실패 시 처리',
      detail: '결제일로부터 1일, 3일, 7일째에 다시 시도합니다. 7일째까지 결제되지 않으면 서비스 이용이 제한됩니다.',
    },
    { label: '취소와 환불 조건', detail: '취소·환불 규정에 정한 기준에 따라 처리합니다.' },
    { label: '결제 통지 수신처', detail: '결제 결과는 입력하신 이메일로 알려드립니다.' },
  ];
}
