import Link from 'next/link';

export const metadata = {
  title: 'FixHC - Not Found',
};

export default function NotFound() {
  return (
    <>
      <div className="caution-tape"></div>
      <header className="hero">
        <h1>
          <span className="yellow">404</span>
          <br />
          <span className="outline">Not Found</span>
        </h1>
        <p className="hero-desc">That page took a detour. Head back and pick a quest.</p>
        <div className="btn-row">
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link href="/dashboard" className="btn btn-outline">
            Open Dashboard
          </Link>
        </div>
      </header>
      <div className="caution-tape"></div>
    </>
  );
}
