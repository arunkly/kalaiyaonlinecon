import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getNepseTicker, type NepseTicker } from "@/lib/nepse";
import { cn } from "@/lib/cn";
import { toNpDigits } from "@/data/articles";

function fmt(n: number, digits = 2) {
  return toNpDigits(
    n.toLocaleString("en-NP", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }),
  );
}

function Chip({
  label,
  value,
  percent,
}: {
  label: string;
  value?: string;
  percent: number;
}) {
  const up = percent >= 0;
  return (
    <span className="mx-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white">
      <span className="font-semibold text-[#7dcc7a]">{label}</span>
      {value ? <span className="tabular-nums text-white/90">{value}</span> : null}
      <span className={cn("tabular-nums text-xs font-semibold", up ? "text-[#7dcc7a]" : "text-[#E87722]")}>
        {up ? "▲" : "▼"} {fmt(Math.abs(percent))}%
      </span>
    </span>
  );
}

export function MarketTicker() {
  const [data, setData] = useState<NepseTicker | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      void getNepseTicker()
        .then((row) => {
          if (alive) setData(row);
        })
        .catch(() => undefined);
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  if (!data) {
    return (
      <div className="border-b border-[#2E7D32]/30 bg-[#111111] px-4 py-2 text-sm text-white/70">
        NEPSE टिकर लोड हुँदै…
      </div>
    );
  }

  const items = [
    <Chip key="nepse" label="NEPSE" value={fmt(data.indexValue)} percent={data.percent} />,
    ...data.stocks.map((s) => (
      <Chip key={s.symbol} label={s.symbol} value={fmt(s.ltp)} percent={s.percent} />
    )),
  ];

  return (
    <div className="border-b border-[#2E7D32]/30 bg-[#111111] text-white">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <Link
          to="/market"
          className="flex shrink-0 items-center gap-2 bg-[#2E7D32] px-3 py-2 text-[11px] font-semibold text-white"
        >
          <span className="size-1.5 rounded-full bg-[#E87722]" />
          सेयर बजार
        </Link>
        <div className="ticker-mask min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track py-2">
            {items}
            {items}
          </div>
        </div>
      </div>
    </div>
  );
}
