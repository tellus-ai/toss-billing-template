import type { Payment } from '../../api/types';
import { formatDateTime, formatWon } from '../../billing/format';

/** 결제 내역. 영수증은 토스 승인 응답의 receipt.url로 연결합니다. */
export function PaymentHistory({ payments }: Readonly<{ payments: readonly Payment[] }>) {
  return (
    <section className="card" style={{ marginTop: 16 }} aria-labelledby="history-title">
      <h2 className="section-title" id="history-title">
        결제 내역
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>결제 일시</th>
              <th>결제 유형</th>
              <th>상품</th>
              <th className="number">금액(부가세 포함)</th>
              <th>상태</th>
              <th>영수증</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{formatDateTime(payment.paidAt)}</td>
                <td>{payment.type}</td>
                <td>{payment.orderName}</td>
                <td className="number">{formatWon(payment.amount)}</td>
                <td>{payment.status}</td>
                <td>
                  {payment.receiptUrl === null ? (
                    '—'
                  ) : (
                    <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                      보기
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payments.length === 0 && (
        <p className="hint" style={{ marginTop: 10 }}>
          결제 내역이 없습니다.
        </p>
      )}
    </section>
  );
}
