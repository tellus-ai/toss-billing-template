import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { formatExpiryInput, keepDigits, validateCardForm, type CardForm } from './card-form';

/** 카드 번호를 입력창처럼 네 자리씩 네 칸으로 나눈다. */
function toGroups(cardNumber: string): readonly string[] {
  return [0, 4, 8, 12].map((start) => cardNumber.slice(start, start + 4));
}

const validCardNumber = fc.stringMatching(/^\d{14,16}$/);
const validMonth = fc.integer({ min: 1, max: 12 }).map((month) => String(month).padStart(2, '0'));
const validYear = fc.stringMatching(/^\d{2}$/);

const validPersonalForm = fc.record({
  cardNumber: validCardNumber,
  month: validMonth,
  year: validYear,
  birth: fc.stringMatching(/^\d{6}$/),
  password: fc.stringMatching(/^\d{2}$/),
});

describe('validateCardForm', () => {
  test('형식이 맞는 개인 카드는 입력값 그대로 등록 요청이 된다', () => {
    fc.assert(
      fc.property(validPersonalForm, ({ cardNumber, month, year, birth, password }) => {
        const form: CardForm = {
          cardNumberGroups: toGroups(cardNumber),
          expiry: `${month}/${year}`,
          ownerType: 'PERSONAL',
          identityNumber: birth,
          passwordPrefix: password,
        };
        expect(validateCardForm(form)).toEqual({
          kind: 'valid',
          card: {
            cardNumber,
            cardExpirationMonth: month,
            cardExpirationYear: year,
            customerIdentityNumber: birth,
            cardPassword: password,
          },
        });
      }),
    );
  });

  test('14자리보다 짧은 카드 번호는 카드 번호 칸 오류다', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{0,13}$/), (cardNumber) => {
        const result = validateCardForm({
          cardNumberGroups: toGroups(cardNumber),
          expiry: '07/29',
          ownerType: 'PERSONAL',
          identityNumber: '880101',
          passwordPrefix: '12',
        });
        expect(result).toMatchObject({ kind: 'invalid', field: 'cardNumber' });
      }),
    );
  });

  test('01~12가 아닌 월은 유효기간 칸 오류다', () => {
    const invalidMonth = fc.oneof(fc.constant(0), fc.integer({ min: 13, max: 99 }))
      .map((month) => String(month).padStart(2, '0'));
    fc.assert(
      fc.property(invalidMonth, (month) => {
        const result = validateCardForm({
          cardNumberGroups: toGroups('4330123412341234'),
          expiry: `${month}/29`,
          ownerType: 'PERSONAL',
          identityNumber: '880101',
          passwordPrefix: '12',
        });
        expect(result).toMatchObject({ kind: 'invalid', field: 'expiry' });
      }),
    );
  });

  test('법인 카드는 사업자등록번호 10자리를 요구한다', () => {
    const result = validateCardForm({
      cardNumberGroups: toGroups('4330123412341234'),
      expiry: '07/29',
      ownerType: 'CORPORATE',
      identityNumber: '880101',
      passwordPrefix: '12',
    });
    expect(result).toEqual({
      kind: 'invalid',
      field: 'identityNumber',
      message: '사업자등록번호 10자리를 입력해 주세요.',
    });
  });

  test('오류 문구에는 입력한 카드 번호가 들어가지 않는다', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{4,13}$/), (cardNumber) => {
        const result = validateCardForm({
          cardNumberGroups: toGroups(cardNumber),
          expiry: '',
          ownerType: 'PERSONAL',
          identityNumber: '',
          passwordPrefix: '',
        });
        expect(result.kind === 'invalid' && result.message.includes(cardNumber)).toBe(false);
      }),
    );
  });
});

describe('입력 서식', () => {
  test('keepDigits는 숫자만 앞에서부터 최대 길이까지 남긴다', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 0, max: 20 }), (value, maxLength) => {
        const digits = keepDigits(value, maxLength);
        expect(digits).toMatch(/^\d*$/);
        expect(digits).toBe(value.replace(/\D/g, '').slice(0, maxLength));
      }),
    );
  });

  test('유효기간 서식은 두 번 적용해도 결과가 같다', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const once = formatExpiryInput(value);
        expect(formatExpiryInput(once)).toBe(once);
      }),
    );
    expect(formatExpiryInput('0729')).toBe('07/29');
  });
});
