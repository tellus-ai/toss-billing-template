/** 서버가 처리한 실패. `code`는 분기용 고정값, `message`는 사용자에게 보여주는 문구입니다. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    /** HTTP 상태. 서버에 닿지 못했으면 `null`입니다. */
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const UNEXPECTED_ERROR_MESSAGE = '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

/** 화면에 보여줄 문구를 고릅니다. 예상하지 못한 오류는 원문을 숨기고 콘솔에 남깁니다. */
export function userMessageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  console.error(error);
  return UNEXPECTED_ERROR_MESSAGE;
}
