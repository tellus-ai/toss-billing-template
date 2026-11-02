import { useCallback, useEffect, useState } from 'react';
import { userMessageOf } from '../api/api-error';

export type LoadState<T> =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'ready'; data: T }>
  | Readonly<{ kind: 'failed'; message: string }>;

/**
 * 화면에 필요한 데이터를 불러옵니다. `reload`는 이전 데이터를 유지한 채 다시 불러옵니다.
 *
 * `load`는 렌더링마다 새로 만들지 않은 함수여야 합니다. API 객체의 메서드를 그대로 넘기면 됩니다.
 */
export function useLoad<T>(load: () => Promise<T>): Readonly<{ state: LoadState<T>; reload: () => void }> {
  const [state, setState] = useState<LoadState<T>>({ kind: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setState({ kind: 'ready', data });
      },
      (error: unknown) => {
        if (active) setState({ kind: 'failed', message: userMessageOf(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  return { state, reload };
}
