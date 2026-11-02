import { describe, expect, test } from 'vitest';
import { createPreviewApi } from './preview-api';

/** sessionStorage와 같은 계약을 가진 메모리 저장소다. */
function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    },
  };
}

function previewApi(storage: ReturnType<typeof memoryStorage>['storage']) {
  return createPreviewApi({
    storage,
    now: () => new Date('2026-11-02T01:00:00Z'),
    newId: () => 'id-1',
    account: { loginId: 'review', password: 'Review1234!' },
    plan: { name: '기본 요금제', monthlySupplyAmount: 30_000, monthlyAmount: 33_000, includedUnits: 100, unitLabel: '시간', overageUnitAmount: 1_100 },
  });
}

const card = {
  customerKey: 'cus_0123456789abcdef0123456789',
  cardNumber: '4330123412349876',
  cardExpirationMonth: '07',
  cardExpirationYear: '29',
  customerIdentityNumber: '880101',
  cardPassword: '12',
};

describe('createPreviewApi', () => {
  test('카드를 등록해도 카드 번호 전체와 생년월일, 비밀번호를 저장하지 않는다', async () => {
    const { storage, values } = memoryStorage();
    const api = previewApi(storage);
    await api.login({ loginId: 'review', password: 'Review1234!' });

    const method = await api.registerCard(card);

    const stored = [...values.values()].join('');
    expect(method.maskedNumber).toBe('****-****-****-9876');
    expect(stored).not.toContain(card.cardNumber);
    expect(stored).not.toContain(card.customerIdentityNumber);
    expect(stored).not.toContain('"cardPassword"');
  });

  test('미리보기 계정이 아니면 같은 실패 문구로 거절한다', async () => {
    const api = previewApi(memoryStorage().storage);
    await expect(api.login({ loginId: 'review', password: 'wrong' })).rejects.toMatchObject({
      code: 'AUTH_FAILED',
      message: '아이디 또는 비밀번호가 일치하지 않습니다.',
    });
  });

  test('해지하면 다음 결제일 전날까지 이용하는 해지 예약이 된다', async () => {
    const { storage } = memoryStorage();
    const api = previewApi(storage);
    await api.login({ loginId: 'review', password: 'Review1234!' });
    await api.registerCard(card);
    await api.startSubscription();

    const canceled = await api.cancelSubscription();

    expect(canceled.nextBillingAt).toBe('2026-12-02T01:00:00.000Z');
    expect(canceled.cancelAt).toBe('2026-12-01T01:00:00.000Z');
  });
});
