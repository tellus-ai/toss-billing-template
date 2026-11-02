import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { userMessageOf } from '../api/api-error';
import type { User } from '../api/types';
import { useAppServices } from '../app/app-services';
import { LoadStatus } from '../components/LoadStatus';

export type SessionState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'anonymous' }>
  | Readonly<{ kind: 'signed_in'; user: User }>
  | Readonly<{ kind: 'failed'; message: string }>;

type SessionValue = Readonly<{
  state: SessionState;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
}>;

const SessionContext = createContext<SessionValue | null>(null);

/** 서버 세션을 한 번 확인해 로그인 상태를 모든 화면에 제공합니다. */
export function SessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { api } = useAppServices();
  const [state, setState] = useState<SessionState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    api.getMe().then(
      (user) => {
        if (active) setState(user === null ? { kind: 'anonymous' } : { kind: 'signed_in', user });
      },
      (error: unknown) => {
        if (active) setState({ kind: 'failed', message: userMessageOf(error) });
      },
    );
    return () => {
      active = false;
    };
  }, [api]);

  const value = useMemo<SessionValue>(
    () => ({
      state,
      signIn: (user) => setState({ kind: 'signed_in', user }),
      signOut: async () => {
        await api.logout();
        setState({ kind: 'anonymous' });
      },
    }),
    [api, state],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const session = useContext(SessionContext);
  if (session === null) throw new Error('SessionProvider 안에서만 사용할 수 있습니다.');
  return session;
}

/** RequireLogin 안쪽 화면에서 로그인한 회원을 읽습니다. 바깥에서 쓰면 잘못 배치한 것이므로 즉시 실패합니다. */
export function useSignedInUser(): User {
  const { state } = useSession();
  if (state.kind !== 'signed_in') throw new Error('useSignedInUser는 RequireLogin 안쪽 화면에서만 사용할 수 있습니다.');
  return state.user;
}

/** 로그인한 회원만 하위 화면을 봅니다. 로그인하지 않았으면 지금 주소를 기억해 로그인 화면으로 보냅니다. */
export function RequireLogin() {
  const { state } = useSession();
  const location = useLocation();

  switch (state.kind) {
    case 'loading':
    case 'failed':
      return (
        <main className="page">
          <LoadStatus state={state} />
        </main>
      );
    case 'anonymous':
      return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
    case 'signed_in':
      return <Outlet />;
  }
}
