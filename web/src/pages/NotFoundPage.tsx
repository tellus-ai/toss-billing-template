import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="page page-narrow">
      <section className="card empty">
        <h1 className="section-title">페이지를 찾을 수 없습니다</h1>
        <Link className="btn btn-primary" to="/">
          처음으로
        </Link>
      </section>
    </main>
  );
}
