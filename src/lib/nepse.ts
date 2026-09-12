import { createServerFn } from "@tanstack/react-start";

export type NepseStock = {
  symbol: string;
  ltp: number;
  percent: number;
};

export type NepseTicker = {
  asOf: string;
  indexValue: number;
  change: number;
  percent: number;
  stocks: NepseStock[];
};

export type NepseIndex = {
  name: string;
  value: number;
  change: number;
  percent: number;
};

export type NepseMarket = NepseTicker & {
  indices: NepseIndex[];
};

const FALLBACK: NepseTicker = {
  asOf: "",
  indexValue: 2542.77,
  change: 4.66,
  percent: 0.18,
  stocks: [
    { symbol: "NABIL", ltp: 0, percent: 0 },
    { symbol: "NICA", ltp: 0, percent: 0 },
    { symbol: "GBIME", ltp: 0, percent: 0 },
  ],
};

let cache: { at: number; data: NepseTicker } | null = null;

async function readJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "KalaiyaOnline/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`nepse ${res.status}`);
  return res.json();
}

export const getNepseTicker = createServerFn({ method: "GET" }).handler(async () => {
  if (cache && Date.now() - cache.at < 60_000) return cache.data;
  try {
    const [idx, market] = await Promise.all([
      readJson("https://nepalipaisa.com/api/GetIndexLive"),
      readJson("https://merolagani.com/handlers/webrequesthandler.ashx?type=market_summary"),
    ]);
    const nepse = (idx?.result ?? []).find((row: { indexName?: string }) => row.indexName === "Nepse");
    const stocks: NepseStock[] = (market?.turnover?.detail ?? [])
      .slice(0, 80)
      .map((row: { s?: string; lp?: number; pc?: number }) => ({
        symbol: String(row.s ?? "").toUpperCase(),
        ltp: Number(row.lp ?? 0),
        percent: Number(row.pc ?? 0),
      }))
      .filter((row: NepseStock) => row.symbol);
    const data: NepseTicker = {
      asOf: String(market?.overall?.d ?? nepse?.asOf ?? ""),
      indexValue: Number(nepse?.indexValue ?? 0),
      change: Number(nepse?.difference ?? 0),
      percent: Number(nepse?.percentChange ?? 0),
      stocks,
    };
    if (!data.indexValue && !data.stocks.length) return FALLBACK;
    cache = { at: Date.now(), data };
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
      await sql`
        insert into market_snapshots (day, payload)
        values (${day}, ${JSON.stringify(data)}::jsonb)
        on conflict (day) do update set payload = excluded.payload, created_at = now()
      `;
    } catch {
      /* snapshot is optional */
    }
    return data;
  } catch {
    return cache?.data ?? FALLBACK;
  }
});

export const getNepseMarket = createServerFn({ method: "GET" }).handler(async () => {
  const base = await getNepseTicker();
  try {
    const idx = await readJson("https://nepalipaisa.com/api/GetIndexLive");
    const indices: NepseIndex[] = (idx?.result ?? [])
      .map((row: { indexName?: string; indexValue?: number; difference?: number; percentChange?: number }) => ({
        name: String(row.indexName ?? ""),
        value: Number(row.indexValue ?? 0),
        change: Number(row.difference ?? 0),
        percent: Number(row.percentChange ?? 0),
      }))
      .filter((row: NepseIndex) => row.name);
    return { ...base, indices };
  } catch {
    return {
      ...base,
      indices: [{ name: "Nepse", value: base.indexValue, change: base.change, percent: base.percent }],
    };
  }
});
