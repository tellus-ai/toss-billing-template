/**
 * 파트너사가 바꾸는 값은 이 파일에만 둡니다. 모든 화면과 정책 문서가 이 값을 읽습니다.
 *
 * 대괄호([ ])로 표시한 값은 화면에서 노란색으로 보입니다. 심사를 신청할 때는 노란색이 하나도 남아 있으면 안 됩니다.
 * 토스 클라이언트 키는 환경마다 다르므로 `.env.local`의 `VITE_TOSS_CLIENT_KEY`에 둡니다.
 */

export type SiteConfig = Readonly<{
  /** 서버 API 주소의 앞부분. 요청 경로는 이 값 뒤에 붙습니다. */
  apiBaseUrl: string;
  /** 심사의 기준은 사업자등록증입니다. 상호명·대표자명·주소를 등록증과 글자까지 같게 적습니다. */
  company: Readonly<{
    name: string;
    ceo: string;
    bizNumber: string;
    /**
     * 통신판매업 신고번호. 아직 받지 못했으면 `null`이며 푸터에 "신고중"으로 표시합니다.
     * 번호가 없으면 국민카드 심사가 제외되므로 받는 즉시 넣습니다.
     */
    mailOrderNumber: string | null;
    address: string;
    tel: string;
    email: string;
    supportHours: string;
    hostingProvider: string;
    privacyOfficer: string;
    privacyEmail: string;
  }>;
  service: Readonly<{
    name: string;
    tagline: string;
    summary: string;
  }>;
  /**
   * 화면에 표시하는 요금입니다. 실제 청구 금액은 서버가 정하므로 서버 값과 반드시 같아야 합니다.
   * 카드사는 화면의 가격과 실제 결제 금액이 같은지 확인합니다.
   */
  plan: Readonly<{
    name: string;
    summary: string;
    monthlySupplyAmount: number;
    /** 부가세 포함. 카드로 실제 결제되는 금액입니다. */
    monthlyAmount: number;
    includedUnits: number;
    unitLabel: string;
    /** 제공량을 넘긴 1단위의 금액. 부가세 포함입니다. */
    overageUnitAmount: number;
    features: readonly string[];
  }>;
  policy: Readonly<{
    effectiveDate: string;
    /** 약관을 개정할 때마다 올립니다. 자동결제 동의를 저장할 때 함께 저장합니다. */
    termsVersion: string;
  }>;
  /** `npm run dev`(미리보기)에서만 쓰는 로그인 계정입니다. 심사 전에 실제 서버 로그인으로 바꿉니다. */
  previewAccount: Readonly<{ loginId: string; password: string }>;
}>;

export const siteConfig: SiteConfig = {
  apiBaseUrl: '/api',
  company: {
    name: '[상호명]',
    ceo: '[대표자명]',
    bizNumber: '[사업자등록번호 000-00-00000]',
    mailOrderNumber: null,
    address: '[사업장 주소]',
    tel: '[고객센터 전화번호]',
    email: '[고객센터 이메일]',
    supportHours: '[고객센터 운영시간]',
    hostingProvider: '[호스팅 서비스 제공자 상호]',
    privacyOfficer: '[개인정보 보호책임자 이름·직책]',
    privacyEmail: '[개인정보 문의 이메일]',
  },
  service: {
    name: '[서비스명]',
    tagline: '[서비스의 핵심 가치를 한 문장으로]',
    summary: '[누구에게 어떤 서비스를 제공하는지 두 문장 이내로 설명]',
  },
  // 예시 금액입니다. 실제 판매가로 바꾸세요.
  plan: {
    name: '[요금제 이름]',
    summary: '[요금제를 한 문장으로 설명]',
    monthlySupplyAmount: 30_000,
    monthlyAmount: 33_000,
    includedUnits: 100,
    unitLabel: '시간',
    overageUnitAmount: 1_100,
    features: ['[제공 기능 1]', '[제공 기능 2]', '[제공 기능 3]'],
  },
  policy: {
    effectiveDate: '[시행일 0000년 00월 00일]',
    termsVersion: '2026-11-02',
  },
  previewAccount: { loginId: 'review', password: 'Review1234!' },
};
