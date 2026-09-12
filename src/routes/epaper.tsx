import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toNpDigits } from "@/data/articles";
import { cn } from "@/lib/cn";
import {
  BS_MONTHS,
  adToBs,
  availableBsYears,
  bsToAd,
  daysInBsMonth,
  formatBs,
  pad,
} from "@/lib/bs-date";
import { bumpEpaperView, listEpapers, type EpaperIssue } from "@/lib/epaper-desk";

export const Route = createFileRoute("/epaper")({ component: EpaperPage });

const WEEK = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

function todayBs() {
  const now = new Date();
  return adToBs(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
}

function adIso(year: number, month: number, day: number) {
  const ad = bsToAd(year, month, day);
  if (!ad) return "";
  return `${ad.year}-${pad(ad.month)}-${pad(ad.day)}`;
}

function EpaperPage() {
  const today = todayBs();
  const years = availableBsYears();
  const [year, setYear] = useState(today?.year ?? 2083);
  const [month, setMonth] = useState(today?.month ?? 1);
  const [picked, setPicked] = useState(today?.day ?? 1);
  const [rows, setRows] = useState<EpaperIssue[]>([]);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [pickId, setPickId] = useState<number | null>(null);

  useEffect(() => {
    void listEpapers().then(setRows).catch(() => undefined);
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, EpaperIssue[]>();
    for (const row of rows) {
      const list = map.get(row.issueDate) ?? [];
      list.push(row);
      map.set(row.issueDate, list);
    }
    return map;
  }, [rows]);

  const selectedIso = adIso(year, month, picked);
  const papers = selectedIso ? byDate.get(selectedIso) ?? [] : [];
  const active = papers.find((p) => p.id === pickId) ?? papers[0] ?? null;

  useEffect(() => {
    if (!active || seen.has(active.id)) return;
    setSeen((prev) => new Set(prev).add(active.id));
    void bumpEpaperView({ data: { id: active.id } }).catch(() => undefined);
  }, [active, seen]);

  const cells = useMemo(() => {
    const count = daysInBsMonth(year, month);
    const first = bsToAd(year, month, 1);
    const start = first ? new Date(Date.UTC(first.year, first.month - 1, first.day)).getUTCDay() : 0;
    const out: ({ day: number; iso: string } | null)[] = [];
    for (let i = 0; i < start; i += 1) out.push(null);
    for (let d = 1; d <= count; d += 1) out.push({ day: d, iso: adIso(year, month, d) });
    return out;
  }, [year, month]);

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (!daysInBsMonth(y, m)) return;
    setYear(y);
    setMonth(m);
    setPicked(1);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#9B1C2C] via-[#b42334] to-[#c2410c] px-5 py-7 text-white sm:px-8">
        <p className="text-[11px] font-bold tracking-[0.22em] text-white/75">ई-पेपर</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">दैनिक पत्रिका।</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">नेपाली पात्रोबाट मिति छानेर त्यो दिनको ई-पेपर हेर्नुहोस्।</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="rounded-[1.4rem] bg-white p-4 shadow-[0_8px_24px_rgba(27,20,16,0.05)]">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => shift(-1)} className="rounded-full border border-line px-3 py-1.5 text-sm">
              अघिल्लो
            </button>
            <div className="text-center">
              <p className="font-display text-xl">{BS_MONTHS[month - 1]}</p>
              <p className="text-xs text-muted">{toNpDigits(year)}</p>
            </div>
            <button type="button" onClick={() => shift(1)} className="rounded-full border border-line px-3 py-1.5 text-sm">
              अर्को
            </button>
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-xl border border-line bg-paper px-2 py-1 text-sm">
              {years.map((y) => (
                <option key={y} value={y}>{toNpDigits(y)}</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-xl border border-line bg-paper px-2 py-1 text-sm">
              {BS_MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted">
            {WEEK.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <span key={`e-${i}`} />;
              const has = byDate.has(cell.iso);
              const on = cell.day === picked;
              const isToday = today && year === today.year && month === today.month && cell.day === today.day;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setPicked(cell.day)}
                  className={cn(
                    "relative min-h-10 rounded-xl text-sm font-semibold",
                    on ? "bg-crimson text-paper" : has ? "bg-crimson/10 text-crimson" : "hover:bg-chip",
                    isToday && !on ? "ring-1 ring-crimson/40" : "",
                  )}
                >
                  {toNpDigits(cell.day)}
                  {has ? <span className={cn("absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full", on ? "bg-paper" : "bg-crimson")} /> : null}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            {formatBs(year, month, picked)}
          </p>
        </section>

        <section className="overflow-hidden rounded-[1.4rem] bg-white shadow-[0_8px_24px_rgba(27,20,16,0.05)]">
          {active ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                <div>
                  <h2 className="font-display text-2xl">{active.title}</h2>
                  <p className="text-xs text-muted">स्रोत: Google Drive · हेराइ {toNpDigits(active.views)}</p>
                </div>
                <a href={active.driveUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-crimson">
                  PDF खोल्नुहोस्
                </a>
              </div>
              {papers.length > 1 ? (
                <div className="flex flex-wrap gap-2 px-4 py-2">
                  {papers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPickId(p.id)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        (active?.id === p.id) ? "bg-crimson text-paper" : "bg-chip",
                      )}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              ) : null}
              <iframe
                title={active.title}
                src={active.previewUrl}
                className="h-[70vh] w-full border-0 bg-[#faf7f2]"
                allow="autoplay"
              />
            </>
          ) : (
            <div className="grid min-h-80 place-items-center px-6 py-16 text-center">
              <div>
                <p className="font-display text-2xl">यो मितिमा ई-पेपर छैन।</p>
                <p className="mt-2 text-sm text-muted">रातो बिन्दु भएको दिनमा ई-पेपर उपलब्ध छ।</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
