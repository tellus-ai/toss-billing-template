import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { formatWon } from '../billing/format';
import { ConfigText } from '../components/ConfigText';
import { siteConfig } from '../config';
import { RefundSummary } from './RefundSummary';

const { service, plan } = siteConfig;

/** 로그인 없이 열리는 첫 화면. 카드사는 여기서 상품, 이미지, 가격, 환불 정책을 확인합니다. */
export function LandingPage() {
  const { hash } = useLocation();

  // 다른 화면에서 "요금제"를 누르면 해당 구역으로 이동합니다.
  useEffect(() => {
    if (hash !== '') document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <h1>
            <ConfigText value={service.tagline} />
          </h1>
          <p>
            <ConfigText value={service.summary} />
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/subscribe">
              구독 시작하기
            </Link>
            <a className="btn btn-secondary" href="#pricing">
              요금 보기
            </a>
          </div>
        </div>
        <div className="hero-image">
          {/* 카드사가 볼 상품 이미지입니다. 실제 서비스 화면 캡처로 바꾸세요. */}
          <img src="/product-placeholder.svg" width={640} height={400} alt="서비스 화면" />
        </div>
      </section>

      <PricingSection />

      <section className="landing-section" aria-labelledby="delivery-title">
        <h2 id="delivery-title">서비스 제공과 환불 안내</h2>
        <p>결제 전에 확인해 주세요.</p>
        <div className="info-grid">
          <article className="card">
            <h3>서비스 제공 방법</h3>
            <ul>
              <li>온라인으로 제공되는 서비스이며 별도로 배송되는 상품이 없습니다.</li>
              <li>결제가 승인되면 즉시 이용할 수 있습니다.</li>
              <li>이용 기간은 결제일부터 다음 결제일 전날까지입니다.</li>
            </ul>
          </article>
          <article className="card">
            <h3>취소·환불 요약</h3>
            <RefundSummary />
            <Link to="/policies/refund">취소·환불 규정 전문 보기</Link>
          </article>
        </div>
      </section>
    </main>
  );
}

function PricingSection() {
  const includedUsage = `월 ${plan.includedUnits}${plan.unitLabel}`;
  return (
    <section className="landing-section" id="pricing" aria-labelledby="pricing-title">
      <h2 id="pricing-title">요금제</h2>
      <p>표시된 금액이 카드로 결제되는 금액입니다. 모든 금액은 부가세를 포함합니다.</p>
      <div className="pricing">
        <article className="card">
          <h3 className="plan-name">
            <ConfigText value={plan.name} />
          </h3>
          <p className="plan-summary">
            <ConfigText value={plan.summary} />
          </p>
          <p className="plan-price">
            <strong>{formatWon(plan.monthlyAmount)}</strong>
            <span>/ 월 (부가세 포함)</span>
          </p>
          {/* 카드사는 결제 1회당 서비스 제공기간을 상품 설명에서 확인합니다. 12개월을 넘으면 입점할 수 없습니다. */}
          <p className="plan-period">서비스 제공기간: 결제일부터 1개월 (다음 결제일 전날까지), 해지하지 않으면 매월 자동 갱신</p>
          <p className="plan-overage">
            {includedUsage} 제공. 초과 사용 시 1{plan.unitLabel}당 {formatWon(plan.overageUnitAmount)}(부가세 포함)이 다음 결제일에 합산 청구됩니다.
          </p>
          <ul className="plan-features">
            {plan.features.map((feature) => (
              <li key={feature}>
                <ConfigText value={feature} />
              </li>
            ))}
          </ul>
          <Link className="btn btn-primary btn-block" to="/subscribe">
            구독 시작하기
          </Link>
        </article>

        <ol className="flow" aria-label="결제 진행 방식">
          <li>
            <strong>오늘 첫 달 구독료를 결제합니다</strong>
            <p>자동결제에 동의하고 카드를 등록한 뒤 {formatWon(plan.monthlyAmount)}을 결제하면 바로 이용할 수 있습니다.</p>
          </li>
          <li>
            <strong>매월 같은 날 자동으로 결제됩니다</strong>
            <p>첫 결제일과 같은 날짜에 결제합니다. 그 날짜가 없는 달은 말일에 결제합니다.</p>
          </li>
          <li>
            <strong>추가 사용료는 다음 결제일에 합산됩니다</strong>
            <p>{includedUsage}를 넘겨 사용한 부분만 계산해 다음 달 구독료와 함께 한 번에 청구합니다.</p>
          </li>
          <li>
            <strong>언제든지 해지할 수 있습니다</strong>
            <p>구독 관리 화면에서 해지하면 다음 결제일부터 청구되지 않고, 결제한 기간의 마지막 날까지 이용할 수 있습니다.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
