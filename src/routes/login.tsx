import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAdminEmail } from "@/lib/admin";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";
import { ensureAdminReady } from "@/lib/desk";
import { sendWelcomeMail } from "@/lib/mail";
import { AppLogo } from "@/components/app-logo";

export const Route = createFileRoute("/login")({ component: Login });

function afterLoginPath(email: string | null | undefined) {
  return isAdminEmail(email) ? "/admin" : "/";
}

function Login() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void ensureAdminReady().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isPending && user) {
      void navigate({ to: afterLoginPath(user.primaryEmail) });
    }
  }, [isPending, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const created = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
        });
        if (created.error) {
          setError(created.error.message || "सदस्य बन्न सकिएन।");
          return;
        }
        void sendWelcomeMail({
          data: { email, name: name.trim() || email.split("@")[0] },
        }).catch(() => undefined);
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message || "लगइन हुन सकेन।");
          return;
        }
      }
      await navigate({ to: afterLoginPath(email) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "लगइन हुन सकेन।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <AppLogo className="h-9 w-auto" />
      <h1 className="mt-5 font-display text-4xl font-bold">
        {mode === "up" ? "सदस्य बन्नुहोस्" : "लगइन"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "up"
          ? "निःशुल्क खाता खोल्नुहोस्। कमेन्ट, लाइक र सेभ गर्न सकिन्छ।"
          : "आफ्नो इमेल र पासवर्डले प्रवेश गर्नुहोस्।"}
      </p>

      <div className="mt-5 grid grid-cols-2 rounded-full border border-line bg-paper p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("in")}
          className={cn(
            "rounded-full py-2",
            mode === "in" ? "bg-crimson text-paper" : "text-muted",
          )}
        >
          लगइन
        </button>
        <button
          type="button"
          onClick={() => setMode("up")}
          className={cn(
            "rounded-full py-2",
            mode === "up" ? "bg-crimson text-paper" : "text-muted",
          )}
        >
          सदस्यता
        </button>
      </div>

      {!authEnabled ? (
        <p className="mt-6 text-sm text-muted">लगइन बन्द छ।</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === "up" ? (
            <label className="block text-sm font-medium">
              नाम
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 text-base outline-none focus:border-crimson"
              />
            </label>
          ) : null}
          <label className="block text-sm font-medium">
            इमेल
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 text-base outline-none focus:border-crimson"
            />
          </label>
          <label className="block text-sm font-medium">
            पासवर्ड
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              minLength={8}
              required
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 text-base outline-none focus:border-crimson"
            />
          </label>
          {error ? <p className="text-sm text-mark">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper hover:bg-crimson-deep disabled:opacity-60"
          >
            {busy
              ? mode === "up"
                ? "खाता बन्दै…"
                : "लगइन हुँदै…"
              : mode === "up"
                ? "सदस्य बन्नुहोस्"
                : "लगइन"}
          </button>
        </form>
      )}

      {mode === "in" ? (
        <p className="mt-4 text-sm">
          <Link to="/forgot-password" className="text-crimson hover:underline">
            पासवर्ड बिर्सनुभयो?
          </Link>
        </p>
      ) : (
        <p className="mt-4 text-xs text-muted">पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।</p>
      )}

      <p className="mt-6 text-sm">
        <Link to="/" className="text-crimson hover:underline">
          पत्रिकामा फर्कनुहोस्
        </Link>
      </p>
    </div>
  );
}
