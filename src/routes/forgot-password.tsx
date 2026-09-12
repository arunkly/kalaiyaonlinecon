import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/password-reset";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6">
      <h1 className="font-display text-3xl font-bold">पासवर्ड रिकभरी</h1>
      <p className="mt-2 text-sm text-muted">
        इमेल लेख्नुहोस्। खाता भए रिकभरी लिंक सोही इमेलमा पठाइन्छ।
      </p>
      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setSent(false);
          void requestPasswordReset({ data: { email } })
            .then(() => setSent(true))
            .catch((err) => setError(err instanceof Error ? err.message : "इमेल पठाइएन।"))
            .finally(() => setBusy(false));
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="इमेल"
          className="w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
        />
        {error ? <p className="text-sm text-mark">{error}</p> : null}
        {sent ? (
          <p className="text-sm text-crimson">यदि खाता छ भने रिकभरी लिंक इमेलमा गयो।</p>
        ) : null}
        <button
          disabled={busy}
          className="w-full rounded-full bg-crimson py-3 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {busy ? "पठाउँदै…" : "इमेलमा लिंक पठाउनुहोस्"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        <Link to="/login" className="text-crimson hover:underline">
          लगइन
        </Link>
      </p>
    </div>
  );
}
