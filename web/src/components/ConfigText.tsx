/** 설정값을 표시합니다. 아직 바꾸지 않은 대괄호 값은 노란색으로 강조해 심사 전에 눈에 띄게 합니다. */
export function ConfigText({ value }: Readonly<{ value: string }>) {
  return value.startsWith('[') ? <mark className="placeholder">{value}</mark> : <>{value}</>;
}
