/**
 * 자동결제 자체 입력창의 형식 규칙.
 *
 * 서버도 같은 기준으로 다시 검사해야 합니다. 화면 검사는 형식이 틀린 카드 정보가 네트워크로 나가지 않게 막을 뿐입니다.
 */

/** 개인 카드는 생년월일, 법인 카드는 사업자등록번호로 본인을 확인합니다. */
export type CardOwnerType = 'PERSONAL' | 'CORPORATE';

export type CardForm = Readonly<{
  /** 네 칸에 나눠 입력한 카드 번호. */
  cardNumberGroups: readonly string[];
  /** `MM/YY` 형식의 유효기간. */
  expiry: string;
  ownerType: CardOwnerType;
  /** 개인은 생년월일 6자리, 법인은 사업자등록번호 10자리. */
  identityNumber: string;
  /** 카드 비밀번호 앞 2자리. */
  passwordPrefix: string;
}>;

export type CardFormField = 'cardNumber' | 'expiry' | 'identityNumber' | 'passwordPrefix';

/** 토스 "카드 정보로 빌링키 발급" 요청에 그대로 쓰는 카드 정보. */
export type CardDetails = Readonly<{
  cardNumber: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  customerIdentityNumber: string;
  cardPassword: string;
}>;

export type CardFormResult =
  | Readonly<{ kind: 'valid'; card: CardDetails }>
  | Readonly<{ kind: 'invalid'; field: CardFormField; message: string }>;

/** 숫자만 앞에서부터 최대 길이까지 남깁니다. */
export function keepDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

/** 숫자 두 자리를 넘기면 사이에 `/`를 넣어 `MM/YY` 모양으로 맞춥니다. */
export function formatExpiryInput(value: string): string {
  const digits = keepDigits(value, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** 첫 번째로 틀린 칸과 안내 문구를 돌려줍니다. 문구에는 입력값을 담지 않습니다. */
export function validateCardForm(form: CardForm): CardFormResult {
  const cardNumber = form.cardNumberGroups.join('');
  if (!/^\d{14,16}$/.test(cardNumber)) {
    return { kind: 'invalid', field: 'cardNumber', message: '카드 번호를 정확히 입력해 주세요.' };
  }

  const expiry = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(form.expiry);
  if (expiry === null || expiry[1] === undefined || expiry[2] === undefined) {
    return { kind: 'invalid', field: 'expiry', message: '유효기간을 MM/YY 형식으로 입력해 주세요.' };
  }

  const personal = form.ownerType === 'PERSONAL';
  if (!(personal ? /^\d{6}$/ : /^\d{10}$/).test(form.identityNumber)) {
    return {
      kind: 'invalid',
      field: 'identityNumber',
      message: personal ? '생년월일 6자리를 입력해 주세요.' : '사업자등록번호 10자리를 입력해 주세요.',
    };
  }

  if (!/^\d{2}$/.test(form.passwordPrefix)) {
    return { kind: 'invalid', field: 'passwordPrefix', message: '카드 비밀번호 앞 2자리를 입력해 주세요.' };
  }

  return {
    kind: 'valid',
    card: {
      cardNumber,
      cardExpirationMonth: expiry[1],
      cardExpirationYear: expiry[2],
      customerIdentityNumber: form.identityNumber,
      cardPassword: form.passwordPrefix,
    },
  };
}
