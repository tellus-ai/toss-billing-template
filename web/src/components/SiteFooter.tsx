import { Link } from 'react-router';
import { siteConfig } from '../config';
import { ConfigText } from './ConfigText';

const { company } = siteConfig;

/** 통신판매업 신고번호를 아직 받지 못했을 때 표시하는 문구. */
const MAIL_ORDER_PENDING_LABEL = '신고중';

type BusinessRow = Readonly<{ label: string; value: string; isEmail: boolean }>;

/** 사업자등록증과 대조하는 항목입니다. docs/03-footer.md의 필수 항목 표와 같습니다. */
const BUSINESS_ROWS: readonly BusinessRow[] = [
  { label: '상호명', value: company.name, isEmail: false },
  { label: '대표자명', value: company.ceo, isEmail: false },
  { label: '사업자등록번호', value: company.bizNumber, isEmail: false },
  {
    label: '통신판매업 신고번호',
    value: company.mailOrderNumber === null ? MAIL_ORDER_PENDING_LABEL : company.mailOrderNumber,
    isEmail: false,
  },
  { label: '사업장 주소', value: company.address, isEmail: false },
  { label: '이메일', value: company.email, isEmail: true },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <nav aria-label="약관 및 정책" className="footer-links">
          <Link to="/policies/terms">이용약관</Link>
          <Link to="/policies/refund">취소·환불 규정</Link>
          <Link to="/policies/privacy">
            <strong>개인정보처리방침</strong>
          </Link>
        </nav>
        <dl className="footer-business">
          {BUSINESS_ROWS.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                {row.isEmail && !row.value.startsWith('[') ? (
                  <a href={`mailto:${row.value}`}>{row.value}</a>
                ) : (
                  <ConfigText value={row.value} />
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="footer-copyright">
          © {new Date().getFullYear()} <ConfigText value={company.name} />. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
