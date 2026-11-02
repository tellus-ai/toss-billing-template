import { Fragment, useState, type FormEvent } from 'react';
import { userMessageOf } from '../../api/api-error';
import { useAppServices } from '../../app/app-services';
import { formatExpiryInput, keepDigits, validateCardForm, type CardFormField, type CardOwnerType } from '../../billing/card-form';

/** 오류가 난 칸으로 포커스를 옮길 때 쓰는 입력창 id. */
const FIELD_INPUT_IDS: Readonly<Record<CardFormField, string>> = {
  cardNumber: 'card-number-0',
  expiry: 'card-expiry',
  identityNumber: 'card-identity',
  passwordPrefix: 'card-password-0',
};

const EMPTY_GROUPS = ['', '', '', ''] as const;
const EMPTY_PASSWORD = ['', ''] as const;

type CardFormProps = Readonly<{
  /** 동의를 저장할 때 서버가 발급한 1회용 구매자 식별키. */
  customerKey: string;
  onRegistered: () => void;
}>;

/**
 * 자동결제 자체 입력창. 카드 정보는 이 컴포넌트 상태에만 두고 등록 요청을 한 번 보낸 뒤 버립니다.
 * 실패하면 비밀번호만 지워 다시 입력하게 합니다.
 */
export function CardForm({ customerKey, onRegistered }: CardFormProps) {
  const { api } = useAppServices();
  const [cardNumberGroups, setCardNumberGroups] = useState<readonly string[]>(EMPTY_GROUPS);
  const [expiry, setExpiry] = useState('');
  const [ownerType, setOwnerType] = useState<CardOwnerType>('PERSONAL');
  const [identityNumber, setIdentityNumber] = useState('');
  const [passwordDigits, setPasswordDigits] = useState<readonly string[]>(EMPTY_PASSWORD);
  const [invalidField, setInvalidField] = useState<CardFormField | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateCardForm({ cardNumberGroups, expiry, ownerType, identityNumber, passwordPrefix: passwordDigits.join('') });
    if (result.kind === 'invalid') {
      setInvalidField(result.field);
      setMessage(result.message);
      document.getElementById(FIELD_INPUT_IDS[result.field])?.focus();
      return;
    }

    setInvalidField(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await api.registerCard({ customerKey, ...result.card });
      setCardNumberGroups(EMPTY_GROUPS);
      setExpiry('');
      setIdentityNumber('');
      setPasswordDigits(EMPTY_PASSWORD);
      onRegistered();
    } catch (error: unknown) {
      setPasswordDigits(EMPTY_PASSWORD);
      setMessage(userMessageOf(error));
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <div>
        <p className="steps-label">2단계 / 2단계</p>
        <h1 className="page-title">자동결제 카드 등록</h1>
        <p className="page-lead">자동결제에 사용할 카드 정보를 입력해 주세요.</p>
      </div>

      <form className="card stack" noValidate autoComplete="off" onSubmit={(event) => void handleSubmit(event)}>
        <p className="notice">
          <strong>안전 안내</strong> 입력하신 카드 정보는 저장되지 않으며 토스페이먼츠에 전달한 뒤 즉시 폐기됩니다. 이 등록 요청은 한 번만 사용할 수 있습니다.
        </p>
        <CardNumberInputs groups={cardNumberGroups} invalid={invalidField === 'cardNumber'} onChange={setCardNumberGroups} />
        <div className="field">
          <label htmlFor="card-expiry">유효기간</label>
          <input
            className="input input-center expiry"
            id="card-expiry"
            inputMode="numeric"
            placeholder="MM/YY"
            aria-describedby="card-expiry-hint"
            aria-invalid={invalidField === 'expiry'}
            value={expiry}
            onChange={(event) => setExpiry(formatExpiryInput(event.target.value))}
          />
          <p className="hint" id="card-expiry-hint">
            카드 앞면에 표기된 월/년 형식으로 입력해 주세요.
          </p>
        </div>
        <OwnerIdentityInput
          ownerType={ownerType}
          value={identityNumber}
          invalid={invalidField === 'identityNumber'}
          onOwnerTypeChange={(nextType) => {
            setOwnerType(nextType);
            setIdentityNumber('');
          }}
          onChange={setIdentityNumber}
        />
        <CardPasswordInputs digits={passwordDigits} invalid={invalidField === 'passwordPrefix'} onChange={setPasswordDigits} />
        {message !== null && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? '카드를 등록하는 중...' : '카드 등록하기'}
        </button>
      </form>
    </section>
  );
}

type DigitGroupsProps = Readonly<{ invalid: boolean; onChange: (next: readonly string[]) => void }>;

/** 네 자리를 채우면 다음 칸으로 이동하는 카드 번호 입력. */
function CardNumberInputs({ groups, invalid, onChange }: DigitGroupsProps & Readonly<{ groups: readonly string[] }>) {
  function change(index: number, value: string) {
    const digits = keepDigits(value, 4);
    onChange(groups.map((group, groupIndex) => (groupIndex === index ? digits : group)));
    if (digits.length === 4 && index < groups.length - 1) document.getElementById(`card-number-${index + 1}`)?.focus();
  }

  return (
    <fieldset className="field">
      <legend>카드 번호</legend>
      <div className="card-number">
        {groups.map((group, index) => (
          <Fragment key={index}>
            {index > 0 && <span aria-hidden="true">-</span>}
            <input
              className="input input-center"
              id={`card-number-${index}`}
              inputMode="numeric"
              aria-label={`카드 번호 ${index + 1}번째 네 자리`}
              aria-invalid={invalid}
              value={group}
              onChange={(event) => change(index, event.target.value)}
            />
          </Fragment>
        ))}
      </div>
    </fieldset>
  );
}

type OwnerIdentityInputProps = Readonly<{
  ownerType: CardOwnerType;
  value: string;
  invalid: boolean;
  onOwnerTypeChange: (ownerType: CardOwnerType) => void;
  onChange: (value: string) => void;
}>;

/** 개인 카드는 생년월일 6자리, 법인 카드는 사업자등록번호 10자리를 받습니다. */
function OwnerIdentityInput({ ownerType, value, invalid, onOwnerTypeChange, onChange }: OwnerIdentityInputProps) {
  const personal = ownerType === 'PERSONAL';
  const input = (
    <input
      className={personal ? 'input input-center' : 'input input-center business-number'}
      id="card-identity"
      inputMode="numeric"
      placeholder={personal ? 'YYMMDD' : '사업자등록번호 10자리'}
      aria-label={personal ? '생년월일 6자리' : '사업자등록번호 10자리'}
      aria-invalid={invalid}
      value={value}
      onChange={(event) => onChange(keepDigits(event.target.value, personal ? 6 : 10))}
    />
  );

  return (
    <fieldset className="field">
      <legend>{personal ? '생년월일 (개인 카드)' : '사업자등록번호 (법인 카드)'}</legend>
      <div className="owner-tabs" role="radiogroup" aria-label="카드 소유 구분">
        {(['PERSONAL', 'CORPORATE'] as const).map((type) => (
          <button key={type} type="button" role="radio" aria-checked={ownerType === type} onClick={() => onOwnerTypeChange(type)}>
            {type === 'PERSONAL' ? '개인 카드' : '법인 카드'}
          </button>
        ))}
      </div>
      {personal ? (
        <div className="identity-row">
          {input}
          <span aria-hidden="true">-</span>
          <span className="masked" aria-hidden="true">
            ●●●●●●●
          </span>
        </div>
      ) : (
        input
      )}
    </fieldset>
  );
}

/** 카드 비밀번호 앞 2자리. 비밀번호 관리자가 저장하거나 채우지 않도록 new-password로 둡니다. */
function CardPasswordInputs({ digits, invalid, onChange }: DigitGroupsProps & Readonly<{ digits: readonly string[] }>) {
  function change(index: number, value: string) {
    const digit = keepDigits(value, 1);
    onChange(digits.map((current, digitIndex) => (digitIndex === index ? digit : current)));
    if (digit.length === 1 && index === 0) document.getElementById('card-password-1')?.focus();
  }

  return (
    <fieldset className="field">
      <legend>카드 비밀번호 앞 2자리</legend>
      <div className="card-password">
        {digits.map((digit, index) => (
          <input
            key={index}
            className="input input-center"
            id={`card-password-${index}`}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            aria-label={`카드 비밀번호 ${index + 1}번째 자리`}
            aria-invalid={invalid}
            value={digit}
            onChange={(event) => change(index, event.target.value)}
          />
        ))}
        <span className="masked" aria-hidden="true">
          •
        </span>
        <span className="masked" aria-hidden="true">
          •
        </span>
      </div>
    </fieldset>
  );
}
