import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { adToBs, bsToAd, BS_MONTHS, formatBs, pad, todayIso } from "@/lib/bs-date";

export const Route = createFileRoute("/date-converter")({ component: DateConverterPage });

function DateConverterPage() {
  const [ad, setAd] = useState(todayIso());
  const [bsY, setBsY] = useState(2083);
  const [bsM, setBsM] = useState(5);
  const [bsD, setBsD] = useState(21);

  const fromAd = useMemo(() => adToBs(ad), [ad]);
  const fromBs = useMemo(() => bsToAd(bsY, bsM, bsD), [bsY, bsM, bsD]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="kicker">क्यालेन्डर</p>
        <h1 className="mt-2 font-display text-4xl font-bold">अंग्रेजी–नेपाली मिति</h1>
        <p className="mt-2 text-sm text-muted">ईस्वी संवत् (AD) र विक्रम संवत् (BS) एक अर्कामा बदल्नुहोस्।</p>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">अंग्रेजीबाट नेपाली</h2>
        <label className="mt-4 block text-sm font-medium">
          अंग्रेजी मिति
          <input
            type="date"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
          />
        </label>
        <p className="mt-4 font-display text-3xl text-crimson">
          {fromAd ? formatBs(fromAd.year, fromAd.month, fromAd.day) : "यो मिति तालिकाबाहिर छ"}
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">नेपालीबाट अंग्रेजी</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">
            वर्ष
            <input
              type="number"
              min={2000}
              max={2100}
              value={bsY}
              onChange={(e) => setBsY(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
            />
          </label>
          <label className="text-sm font-medium">
            महिना
            <select
              value={bsM}
              onChange={(e) => setBsM(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
            >
              {BS_MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            गते
            <input
              type="number"
              min={1}
              max={32}
              value={bsD}
              onChange={(e) => setBsD(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
            />
          </label>
        </div>
        <p className="mt-4 font-display text-3xl text-crimson">
          {fromBs ? `${fromBs.year}-${pad(fromBs.month)}-${pad(fromBs.day)}` : "यो मिति मान्य छैन"}
        </p>
      </section>
    </div>
  );
}
