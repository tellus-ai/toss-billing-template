type PendingState = Readonly<{ kind: 'loading' }> | Readonly<{ kind: 'failed'; message: string }>;

/** 데이터를 기다리는 중이거나 불러오지 못한 상태를 보여줍니다. 빈 화면을 남기지 않습니다. */
export function LoadStatus({ state }: Readonly<{ state: PendingState }>) {
  return state.kind === 'loading' ? (
    <p className="status" role="status">불러오는 중입니다.</p>
  ) : (
    <p className="notice notice-danger" role="alert">{state.message}</p>
  );
}
