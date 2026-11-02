# 구독·자동결제 카드 심사 템플릿

토스페이먼츠 카드사 심사를 받으려면 무엇을 개발해야 하는지 정리한 문서와, 바로 실행해 볼 수 있는 TypeScript React 화면입니다.
텔어스가 운영 중인 구독 결제 구조를 다른 서비스도 쓸 수 있게 일반화했습니다.

- **대상**: 월 구독료에 추가 사용료가 붙는 서비스를 만드는 개발자와 담당자
- **결제 구성**: 정기결제(1개월 구독) + 자동결제(추가 사용량을 다음 결제일에 합산)
- **기술**: React 19, TypeScript, Vite, React Router, Zod, 토스페이먼츠 JavaScript SDK
- **기준일**: 2026-11-02. 토스 정책은 바뀔 수 있으니 계약 담당자에게 최종 확인하세요.

## 미리보기

서버 없이 화면 전체 흐름을 볼 수 있습니다. Node.js 22가 필요합니다.

```bash
cd template/web
npm ci
npm run dev
```

터미널에 나온 주소(기본 `http://localhost:5173`)를 열고 다음 계정으로 로그인합니다.

| 아이디 | 비밀번호 |
| --- | --- |
| `review` | `Review1234!` |

추천 순서: 랜딩 → 구독 시작 → 로그인 → 카드 등록 → 결제 → 구독 관리 → 해지.
카드 번호를 `0000`으로 시작하면 카드 거절 화면을, `/billing?demo=past_due` 를 열면 미납 안내를 볼 수 있습니다.

미리보기에서는 실제 로그인과 결제가 일어나지 않습니다. 실제 카드 정보를 입력하지 마세요.

## 명령

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 미리보기. 가짜 API로 동작 |
| `npm run dev:server` | 개발 서버. 실제 API(`/api`)를 호출 |
| `npm run build` | 운영 빌드. 실제 API를 호출 |
| `npm run build:preview` | 미리보기 빌드. 화면을 공유할 때만 사용하고 운영에 배포하지 않음 |
| `npm run verify` | 린트, 타입 검사, 테스트, 운영 빌드 |

실행 모드는 명령이 정합니다. `dev`와 `build:preview`만 미리보기이고, 나머지는 모두 실제 서버를 호출합니다.

토스 결제창을 실제로 열려면 `.env.example`을 `.env.local`로 복사해 `VITE_TOSS_CLIENT_KEY`에 테스트 클라이언트 키를 넣습니다.
`dev:server`로 실행할 때 API 서버가 다른 주소에 있으면 [Vite 프록시](https://vite.dev/config/server-options#server-proxy)로 `/api`를 연결하세요.

## 요구 사항별 위치

| 심사 요구 사항 | 문서 | 화면 |
| --- | --- | --- |
| 전체 개발 항목과 체크리스트 | [01-card-review-checklist](docs/01-card-review-checklist.md) | |
| 운영 중인 아이디·비밀번호 로그인 | [02-login-and-review-account](docs/02-login-and-review-account.md) | [LoginPage](web/src/pages/LoginPage.tsx) |
| 푸터 사업자 정보 | [03-footer](docs/03-footer.md) | [SiteFooter](web/src/components/SiteFooter.tsx) |
| 토스페이먼츠 연동 | [04-toss-integration](docs/04-toss-integration.md) | [billing-auth](web/src/toss/billing-auth.ts), [TossExamplePage](web/src/pages/TossExamplePage.tsx) |
| 구독·자동결제 페이지 | [05-subscription-pages](docs/05-subscription-pages.md) | [LandingPage](web/src/pages/LandingPage.tsx), [SubscribePage](web/src/pages/SubscribePage.tsx), [payment-method/](web/src/pages/payment-method/), [billing/](web/src/pages/billing/) |
| 환불 정책 등 정책 문서 | [06-policy-documents](docs/06-policy-documents.md) | [policies/](web/src/pages/policies/) |
| 계약 심사 메일 회신 | [07-contract-review-reply](docs/07-contract-review-reply.md) | |
| 결제경로 PPT | [08-payment-path-file](docs/08-payment-path-file.md) | 화면 캡처 |

## 코드 구조

```text
web/src/
  config.ts          파트너사가 바꾸는 값 (회사 정보, 요금, 정책 값)
  main.tsx           실행 모드에 따라 실제 API 또는 미리보기 API 연결
  api/               서버 경계: API 계약(types.ts), 응답 검증(schemas.ts), 실제 호출, 미리보기
  billing/           순수 로직: 카드 입력 검증, 다음 결제일, 환불 계산 (테스트 포함)
  toss/              토스 SDK 경계: 결제창 열기, 콜백 읽기
  auth/              세션, 로그인 필요 화면, 로그인 뒤 복귀 주소 검증
  content/           자동결제 동의 문구
  components/        머리글, 푸터, 대화상자
  pages/             화면
```

## 작업 순서

1. **계약 범위 확인**: 토스 계약 담당자에게 [확인할 질문](docs/04-toss-integration.md#개발-전에-토스에-확인할-것)을 먼저 보냅니다. 자체 입력창을 만들 수 있는지에 따라 개발 범위가 달라집니다.
2. **값 채우기**: [config.ts](web/src/config.ts)만 고치면 모든 화면과 정책 문서에 반영됩니다. 화면의 노란색 표시가 사라질 때까지 채웁니다.
3. **정책 확정**: 정책 초안을 자사 조건에 맞게 고치고 법무 검토를 받습니다.
4. **로그인 연결**: 운영 서버의 실제 로그인을 붙이고 운영 서버에 심사 계정을 만듭니다. 심사에는 dev·test 같은 개발 주소나 `test` 같은 테스트 계정이 아니라 [운영 URL과 운영 계정](docs/07-contract-review-reply.md#운영-url과-운영-계정만-쓴다)만 씁니다.
5. **결제 연동**: 테스트 키로 카드 등록, 첫 결제, 정기 갱신을 서버에 구현합니다.
6. **화면 연결**: 서버가 [API 계약](docs/05-subscription-pages.md#api-계약)을 지키면 `npm run build` 결과물이 그대로 서버에 붙습니다. 자사 프레임워크로 옮겨도 됩니다.
7. **점검과 회신**: [체크리스트](docs/01-card-review-checklist.md#심사-전달-전-최종-점검)를 확인하고, [계약 심사 메일 회신](docs/07-contract-review-reply.md) 양식과 [결제경로 PPT](docs/08-payment-path-file.md)를 메일을 받은 지 1개월 안에 보냅니다.

## 심사 전달 전에 지울 것

- 운영에는 `npm run build` 결과물만 배포 (미리보기 빌드 금지)
- `config.ts`의 `previewAccount` 삭제
- `App.tsx`의 `/toss-example` 경로와 `TossExamplePage.tsx` 삭제 (개발 확인용)
- 노란색 표시가 남은 값 0개

## 이 템플릿의 범위

- 서버 코드는 포함하지 않습니다. 필요한 API 계약과 토스 호출 예시는 문서에 있습니다.
- 정책 문서는 초안입니다. 법률 자문이 아니므로 자사 서비스에 맞게 고치고 법무 검토를 받으세요.
- 심사 통과를 보장하지 않습니다. 최종 판단은 토스페이먼츠와 카드사가 합니다.

## 문의처

- [토스페이먼츠 계약과정 FAQ](https://tosspublic.notion.site/FAQ-78932357c9c34620bb8e1f311b2b14cc): 서류, 상품 게시, 결제경로 예시 파일
- 토스페이먼츠 기술 지원: 1544-7772(내선 2~4번), techsupport@tosspayments.com
- [개발자센터](https://developers.tosspayments.com/), [개발자 커뮤니티](https://techchat.tosspayments.com/)
