import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toNpDigits } from "@/data/articles";
import {
  BS_MONTHS,
  adToBs,
  availableBsYears,
  bsToAd,
  daysInBsMonth,
  formatBs,
  pad,
} from "@/lib/bs-date";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/patro")({ component: PatroPage });

const WEEK = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];
const AD_MONTHS = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];

function todayBs() {
  const now = new Date();
  const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return adToBs(iso);
}

function PatroPage() {
  const today = todayBs();
  const years = availableBsYears();
  const [year, setYear] = useState(today?.year ?? 2083);
  const [month, setMonth] = useState(today?.month ?? 5);
  const [picked, setPicked] = useState(today?.day ?? 1);

  const cells = useMemo(() => {
    const count = daysInBsMonth(year, month);
    const first = bsToAd(year, month, 1);
    const start = first ? new Date(Date.UTC(first.year, first.month - 1, first.day)).getUTCDay() : 0;
    const out: ({ day: number; ad: string } | null)[] = [];
    for (let i = 0; i < start; i += 1) out.push(null);
    for (let d = 1; d <= count; d += 1) {
      const ad = bsToAd(year, month, d);
      out.push({
        day: d,
        ad: ad ? `${ad.day} ${AD_MONTHS[ad.month - 1]}` : "",
      });
    }
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

  const selectedAd = bsToAd(year, month, picked);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-[#9B1C2C] px-5 py-7 text-white">
        <p className="text-[11px] font-bold tracking-[0.2em]">NEPALI PATRO</p>
        <h1 className="mt-2 font-display text-4xl font-normal">पात्रो</h1>
        <p className="mt-2 text-sm text-white/85">नेपाली विक्रम संवत् मासिक पात्रो — आजको मिति र अंग्रेजी मिति सँगै।</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-line bg-surface p-4 lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => shift(-1)} className="rounded-full border border-line px-3 py-2 text-sm">
              अघिल्लो
            </button>
            <div className="text-center">
              <p className="font-display text-2xl">
                {BS_MONTHS[month - 1]} {toNpDigits(year)}
              </p>
            </div>
            <button type="button" onClick={() => shift(1)} className="rounded-full border border-line px-3 py-2 text-sm">
              अर्को
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 text-center text-xs font-semibold text-muted">
            {WEEK.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} className="min-h-16" />;
              const isToday = today && today.year === year && today.month === month && today.day === cell.day;
              const isPicked = picked === cell.day;
              const sunday = i % 7 === 6;
              return (
                <button
                  key={cell.day}
                  type="button"
                  onClick={() => setPicked(cell.day)}
                  className={cn(
                    "min-h-16 rounded-xl border px-1 py-2 text-center",
                    isToday ? "border-crimson bg-crimson text-paper" : "border-line bg-paper",
                    isPicked && !isToday ? "border-crimson" : "",
                    sunday && !isToday ? "text-mark" : "",
                  )}
                >
                  <span className="block font-display text-xl leading-none">{toNpDigits(cell.day)}</span>
                  <span className={cn("mt-1 block text-[10px]", isToday ? "text-paper/80" : "text-muted")}>{cell.ad}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-4">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted">आज</p>
            <p className="mt-2 font-display text-3xl">
              {today ? formatBs(today.year, today.month, today.day) : "—"}
            </p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-crimson"
              onClick={() => {
                if (!today) return;
                setYear(today.year);
                setMonth(today.month);
                setPicked(today.day);
              }}
            >
              आजको महिना देखाउनुहोस्
            </button>
          </section>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted">छानिएको दिन</p>
            <p className="mt-2 font-display text-2xl">{formatBs(year, month, picked)}</p>
            {selectedAd ? (
              <p className="mt-1 text-sm text-muted">
                {toNpDigits(selectedAd.day)} {AD_MONTHS[selectedAd.month - 1]} {toNpDigits(selectedAd.year)}
              </p>
            ) : null}
          </section>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-paper px-3 py-3"
          >
            {years.filter((y) => y >= 2070 && y <= 2090).map((y) => (
              <option key={y} value={y}>
                {toNpDigits(y)}
              </option>
            ))}
          </select>
        </aside>
      </div>
    </div>
  );
}
