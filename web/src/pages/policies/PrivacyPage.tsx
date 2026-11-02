import { ConfigText } from '../../components/ConfigText';
import { siteConfig } from '../../config';

const { company, policy } = siteConfig;

/** 개인정보처리방침 초안. 실제 수집 항목과 위탁 업체로 바꾸고 법무 검토를 받으세요. */
export function PrivacyPage() {
  return (
    <main className="page">
      <article className="policy">
        <h1>개인정보처리방침</h1>
        <p className="policy-meta">
          시행일: <ConfigText value={policy.effectiveDate} />
        </p>
        <p>
          <ConfigText value={company.name} />(이하 "회사")은 개인정보 보호법 등 관련 법령을 지키며 이용자의 개인정보를 다음과 같이 처리합니다.
        </p>

        <h2>1. 처리 목적과 항목</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>목적</th>
                <th>항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>회원 가입과 계정 관리</td>
                <td>
                  아이디, 비밀번호(암호화), 이름, 이메일, <ConfigText value="[그 외 수집 항목]" />
                </td>
              </tr>
              <tr>
                <td>구독 결제와 환불</td>
                <td>카드사, 마스킹된 카드 번호, 빌링키(암호화), 결제 일시와 금액, 결제 안내 이메일</td>
              </tr>
              <tr>
                <td>고객 문의 처리</td>
                <td>이름, 연락처, 문의 내용</td>
              </tr>
              <tr>
                <td>서비스 안정성과 부정 이용 방지</td>
                <td>접속 기록, IP 주소, 기기 정보</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>회사는 카드 번호 전체, 카드 비밀번호, 생년월일을 저장하지 않습니다. 이 정보는 카드 등록 시 토스페이먼츠로 전달한 뒤 폐기합니다.</p>

        <h2>2. 처리 및 보유 기간</h2>
        <p>회사는 처리 목적을 달성하면 개인정보를 지체 없이 파기합니다. 다만 관련 법령에 따라 다음 기간 동안 보관합니다.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>기록</th>
                <th>기간</th>
                <th>근거</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>계약 또는 청약 철회 등에 관한 기록</td>
                <td>5년</td>
                <td>전자상거래법</td>
              </tr>
              <tr>
                <td>대금 결제 및 재화 등의 공급에 관한 기록</td>
                <td>5년</td>
                <td>전자상거래법</td>
              </tr>
              <tr>
                <td>소비자 불만 또는 분쟁 처리에 관한 기록</td>
                <td>3년</td>
                <td>전자상거래법</td>
              </tr>
              <tr>
                <td>접속 기록</td>
                <td>3개월</td>
                <td>통신비밀보호법</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. 개인정보의 제3자 제공</h2>
        <p>회사는 이용자의 동의가 있거나 법령에 근거가 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.</p>

        <h2>4. 개인정보 처리의 위탁</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>수탁자</th>
                <th>위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>토스페이먼츠 주식회사</td>
                <td>결제 처리, 빌링키 발급과 관리</td>
              </tr>
              <tr>
                <td>
                  <ConfigText value={company.hostingProvider} />
                </td>
                <td>서비스 인프라 운영</td>
              </tr>
              <tr>
                <td>
                  <ConfigText value="[이메일 발송 업체]" />
                </td>
                <td>결제 안내 이메일 발송</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>5. 개인정보의 파기</h2>
        <p>전자 파일은 복구할 수 없는 방법으로 삭제하고, 종이 문서는 분쇄하거나 소각합니다.</p>

        <h2>6. 정보주체의 권리</h2>
        <p>
          이용자는 언제든지 개인정보의 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 서비스 내 설정 또는 <ConfigText value={company.privacyEmail} />로 요청하면
          회사는 지체 없이 조치합니다.
        </p>

        <h2>7. 안전성 확보 조치</h2>
        <ol>
          <li>비밀번호와 빌링키를 암호화해 저장합니다.</li>
          <li>모든 통신을 TLS로 암호화합니다.</li>
          <li>개인정보 접근 권한을 업무 담당자로 제한하고 접속 기록을 보관합니다.</li>
        </ol>

        <h2>8. 쿠키</h2>
        <p>회사는 로그인 유지를 위해 쿠키를 사용합니다. 이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나 이 경우 로그인이 필요한 서비스를 이용할 수 없습니다.</p>

        <h2>9. 개인정보 보호책임자</h2>
        <p>
          보호책임자: <ConfigText value={company.privacyOfficer} /> · 문의: <ConfigText value={company.privacyEmail} />
        </p>

        <h2>10. 권익침해 구제</h2>
        <ul>
          <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
          <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
          <li>대검찰청: 1301 (www.spo.go.kr)</li>
          <li>경찰청: 182 (ecrm.police.go.kr)</li>
        </ul>

        <h2>11. 방침의 변경</h2>
        <p>이 방침을 변경하면 시행 7일 전부터 서비스에 공지합니다.</p>
      </article>
    </main>
  );
}
