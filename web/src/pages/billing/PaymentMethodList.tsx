import { Link } from 'react-router';
import type { PaymentMethod } from '../../api/types';

type PaymentMethodListProps = Readonly<{
  paymentMethods: readonly PaymentMethod[];
  onSetDefault: (paymentMethodId: string) => void;
  onDelete: (paymentMethodId: string) => void;
}>;

/** 등록 카드 목록. 주 결제 카드로 구독료와 추가 사용료를 함께 청구합니다. */
export function PaymentMethodList({ paymentMethods, onSetDefault, onDelete }: PaymentMethodListProps) {
  return (
    <section className="card" style={{ marginTop: 16 }} aria-labelledby="methods-title">
      <div className="section-head">
        <h2 className="section-title" id="methods-title">
          결제 수단
        </h2>
        <Link className="btn btn-secondary btn-small" to="/payment-method">
          카드 추가
        </Link>
      </div>
      {paymentMethods.length === 0 && <p className="hint">등록된 카드가 없습니다.</p>}
      {paymentMethods.map((method) => (
        <div className="method-row" key={method.id}>
          <span>
            {method.cardCompany} {method.maskedNumber} {method.isDefault && <span className="badge badge-primary">주 결제 카드</span>}
          </span>
          <div className="method-actions">
            {!method.isDefault && (
              <button className="btn btn-secondary btn-small" type="button" onClick={() => onSetDefault(method.id)}>
                주 결제 카드로 지정
              </button>
            )}
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onDelete(method.id)}>
              삭제
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
