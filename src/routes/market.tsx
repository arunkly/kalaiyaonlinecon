import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { cn } from "@/lib/cn";
import { toNpDigits } from "@/data/articles";
import { getNepseMarket, type NepseMarket } from "@/lib/nepse";

export const Route = createFileRoute("/market")({ component: MarketPage });

function fmt(n: number, digits = 2) {
  return toNpDigits(
    n.toLocaleString("en-NP", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }),
  );
}

function MarketPage() {
  const [data, setData] = useState<NepseMarket | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    void getNepseMarket().then(setData);
    const id = window.setInterval(() => {
      void getNepseMarket().then(setData);
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const stocks = useMemo(() => {
    const rows = data?.stocks ?? [];
    if (!q.trim()) return rows;
    return rows.filter((s) => s.symbol.includes(q.trim().toUpperCase()));
  }, [data, q]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-[#10261a] px-5 py-8 text-white">
        <p className="text-[11px] font-bold tracking-[0.2em] text-mark">NEPSE LIVE</p>
        <h1 className="mt-2 font-display text-4xl font-normal">नेपाली सेयर बजार</h1>
        <p className="mt-2 max-w-xl text-sm text-white/75">
          नेप्से इन्डेक्स र सक्रिय सेयरको लाइभ अपडेट। प्रत्येक एक मिनेटमा ताजा हुन्छ।
        </p>
        {data ? (
          <p className="mt-4 font-display text-3xl tabular-nums">
            {fmt(data.indexValue)}{" "}
            <span className={data.percent >= 0 ? "text-mark" : "text-[#ffb4a2]"}>
              {data.percent >= 0 ? "▲" : "▼"} {fmt(Math.abs(data.change))} ({fmt(Math.abs(data.percent))}%)
            </span>
          </p>
        ) : (
          <p className="mt-4 text-sm text-white/60">लोड हुँदै…</p>
        )}
        {data?.asOf ? <p className="mt-1 text-xs text-white/50">{data.asOf}</p> : null}
      </div>
      <AdSlot slot="home" />

      <section>
        <h2 className="font-display text-2xl">इन्डेक्स</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.indices ?? []).map((row) => (
            <article key={row.name} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm text-muted">{row.name}</p>
              <p className="mt-1 font-display text-2xl tabular-nums">{fmt(row.value)}</p>
              <p className={cn("mt-1 text-sm font-semibold", row.percent >= 0 ? "text-crimson" : "text-mark")}>
                {row.percent >= 0 ? "▲" : "▼"} {fmt(Math.abs(row.change))} · {fmt(Math.abs(row.percent))}%
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl">सेयर सूची</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="सिम्बोल खोज्नुहोस्"
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-crimson"
          />
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-chip text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3">सिम्बोल</th>
                <th className="px-4 py-3">LTP</th>
                <th className="px-4 py-3">परिवर्तन %</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.symbol} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">{s.symbol}</td>
                  <td className="px-4 py-3 tabular-nums">{fmt(s.ltp, s.ltp >= 100 ? 1 : 2)}</td>
                  <td className={cn("px-4 py-3 tabular-nums font-semibold", s.percent >= 0 ? "text-crimson" : "text-mark")}>
                    {s.percent >= 0 ? "▲" : "▼"} {fmt(Math.abs(s.percent))}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stocks.length ? <p className="px-4 py-8 text-center text-muted">सेयर डेटा छैन।</p> : null}
        </div>
        <p className="mt-3 text-xs text-muted">
          स्रोत: नेप्से / सार्वजनिक बजार फिड। लगानी निर्णय आफ्नै जोखिममा गर्नुहोस्।
        </p>
      </section>
    </div>
  );
}
