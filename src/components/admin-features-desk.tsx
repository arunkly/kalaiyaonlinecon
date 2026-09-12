import { useEffect, useState } from "react";
import { DEFAULT_FEATURES, FEATURE_CATALOG, getFeatureFlags, saveFeatureFlags, type FeatureFlags } from "@/lib/features";

export function FeaturesDeskPanel() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    void getFeatureFlags()
      .then(setFlags)
      .catch(() => undefined);
  }, []);

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">मोड्युल अन / अफ</h2>
      <p className="text-sm text-muted">बन्द गरेको सेवा मेनु, होमपेज र पेजबाट लुक्छ।</p>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {ok ? <p className="text-sm font-semibold text-[#14934e]">{ok}</p> : null}
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {FEATURE_CATALOG.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted">{item.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={flags[item.key]}
              onClick={() => setFlags((f) => ({ ...f, [item.key]: !f[item.key] }))}
              className={
                flags[item.key]
                  ? "relative h-7 w-12 rounded-full bg-crimson"
                  : "relative h-7 w-12 rounded-full bg-line-strong"
              }
            >
              <span
                className={
                  flags[item.key]
                    ? "absolute top-0.5 left-6 size-6 rounded-full bg-white shadow"
                    : "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow"
                }
              />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          setError(null);
          setOk(null);
          void saveFeatureFlags({ data: { flags } })
            .then(() => setOk("सेभ भयो। पेज रिफ्रेस गर्नुहोस्।"))
            .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
            .finally(() => setSaving(false));
        }}
        className="inline-flex min-h-11 items-center rounded-md bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {saving ? "सेभ हुँदै…" : "मोड्युल सेभ गर्नुहोस्"}
      </button>
    </section>
  );
}
