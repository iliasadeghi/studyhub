import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 scale-150 rounded-full bg-accent-soft blur-2xl"
        />
        <div className="relative grid h-20 w-20 place-items-center rounded-2xl border border-border bg-surface text-accent-text shadow-card">
          <Compass className="h-10 w-10" aria-hidden />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold tracking-widest text-accent-text">404</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">This page skipped class</h1>
        <p className="mt-2 text-muted">
          We couldn't find what you were looking for. It may have moved, or the link might be off.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg shadow-soft hover:bg-accent-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
