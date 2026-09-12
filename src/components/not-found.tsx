import { Link } from "@tanstack/react-router";

export function AppNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-crimson">४०४</p>
      <h1 className="mt-2 font-display text-4xl">यो पृष्ठ भेटिएन</h1>
      <p className="mt-3 text-sm text-muted">यो अंकमा त्यो समाचार छैन।</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper"
      >
        गृहपृष्ठ
      </Link>
    </div>
  );
}
