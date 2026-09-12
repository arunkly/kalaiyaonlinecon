import { useEffect, useState } from "react";
import { getMailSettings, saveMailSettings } from "@/lib/mail";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function SettingsDeskPanel() {
  const [fromEmail, setFromEmail] = useState("noreply@kalaiyaonline.com");
  const [fromName, setFromName] = useState("KalaiyaOnline");
  const [resendKey, setResendKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function refresh() {
    void getMailSettings()
      .then((m) => {
        setFromEmail(m.fromEmail);
        setFromName(m.fromName);
        setHasKey(m.hasKey);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">इमेल सेटिङ</h2>
      <p className="text-sm text-muted">
        पासवर्ड रिकभरी र सूचना इमेलका लागि{" "}
        <a href="https://resend.com/api-keys" className="text-crimson hover:underline" target="_blank" rel="noreferrer">
          Resend
        </a>{" "}
        API की राख्नुहोस्।
        {hasKey ? " की सेभ छ। नयाँ की लेखे मात्र बदलिन्छ।" : " की अहिले छैन।"}
      </p>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {ok ? <p className="text-sm text-[#14934e]">{ok}</p> : null}
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setOk(null);
          void saveMailSettings({ data: { fromEmail, fromName, resendKey: resendKey || undefined } })
            .then(() => {
              setResendKey("");
              setOk("सेटिङ सेभ भयो।");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "सेटिङ सेभ भएन।"))
            .finally(() => setSaving(false));
        }}
      >
        <label className="text-sm font-medium">
          पठाउने नाम
          <input value={fromName} onChange={(e) => setFromName(e.target.value)} required className={field} />
        </label>
        <label className="text-sm font-medium">
          पठाउने इमेल
          <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} required className={field} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Resend API की
          <input
            type="password"
            autoComplete="off"
            value={resendKey}
            onChange={(e) => setResendKey(e.target.value)}
            placeholder={hasKey ? "••••••••  (बदल्न नयाँ की लेख्नुहोस्)" : "re_xxxxxxxx"}
            className={field}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {saving ? "सेभ हुँदै…" : "सेभ गर्नुहोस्"}
        </button>
      </form>
    </section>
  );
}
