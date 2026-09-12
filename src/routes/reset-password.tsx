import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { completePasswordReset } from "@/lib/password-reset";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6">
      <h1 className="font-display text-3xl font-bold">नयाँ पासवर्ड</h1>
      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!token) {
            setError("रिकभरी लिंक छैन।");
            return;
          }
          setBusy(true);
          setError(null);
          void completePasswordReset({ data: { token, password } })
            .then(() => navigate({ to: "/login" }))
            .catch((err) => setError(err instanceof Error ? err.message : "रिसेट भएन।"))
            .finally(() => setBusy(false));
        }}
      >
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="नयाँ पासवर्ड"
          className="w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
        />
        {error ? <p className="text-sm text-mark">{error}</p> : null}
        <button
          disabled={busy}
          className="w-full rounded-full bg-crimson py-3 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {busy ? "सेभ हुँदै…" : "पासवर्ड सेभ गर्नुहोस्"}
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
