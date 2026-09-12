import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PoliticiansReel } from "@/components/election-people";
import { ElectionEmbedCode } from "@/components/election-embed";
import { ElectionProvider, useElection } from "@/lib/election-live";
import {
  LOCAL_POSTS,
  baraLocals,
  baraSeats,
  formatInt,
  frontPageOf,
  electionYears,
  embedEnabled,
  osmEmbed,
  palikaCoords,
  partyShort,
  seatCoords,
  seatLabel,
  statusLabel,
  type Candidate,
  type Constituency,
  type LocalBody,
} from "@/lib/election";

export const Route = createFileRoute("/election")({ component: ElectionRoute });

function ElectionRoute() {
  return (
    <ElectionProvider>
      <ElectionHome />
    </ElectionProvider>
  );
}

function ranked(candidates: Candidate[]) {
  return [...candidates].sort((a, b) => b.votes - a.votes);
}

function ElectionHome() {
  const { data } = useElection();
  const seats = baraSeats(data);
  const locals = baraLocals(data);
  const [tab, setTab] = useState<"home" | "hor" | "local">(frontPageOf(data));
  const [seatId, setSeatId] = useState("");
  const [palikaId, setPalikaId] = useState("");
  const seat = seats.find((s) => s.id === seatId);
  const palika = locals.find((b) => b.id === palikaId);
  const years = electionYears(data);
  const yearLine =
    tab === "hor"
      ? `प्रतिनिधिसभा निर्वाचन ${years.hor}`
      : tab === "local"
        ? `स्थानीय निकाय निर्वाचन ${years.local}`
        : `प्रतिनिधिसभा ${years.hor} · स्थानीय ${years.local}`;
  const mapPin =
    tab === "hor" && seat
      ? { title: seatLabel(seat, "np"), ...seatCoords(seat.seat) }
      : tab === "local" && palika
        ? { title: palika.name, ...palikaCoords(palika.id) }
        : null;

  return (
    <div className="-mx-4 space-y-5 sm:mx-0">
      <PoliticiansReel data={data} />

      <section className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_12px_40px_rgba(27,20,16,0.06)]">
        <div className="bg-gradient-to-br from-[#9B1C2C] via-[#b42334] to-[#c2410c] px-5 py-6 text-white sm:px-8 sm:py-8">
          <p className="text-[11px] font-bold tracking-[0.22em] text-white/75">बारा जिल्ला · {yearLine}</p>
          <h1 className="mt-2 font-display text-4xl leading-[1.15] sm:text-5xl">
            {tab === "home" ? "चुनावी डेस्क।" : tab === "hor" ? "प्रतिनिधिसभा।" : "स्थानीय निकाय।"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            {tab === "hor"
              ? `प्रतिनिधिसभा निर्वाचन ${years.hor} — ४ क्षेत्रको नतिजा।`
              : tab === "local"
                ? `स्थानीय निकाय निर्वाचन ${years.local} — पालिका छानेर हेर्नुहोस्।`
                : `प्रतिनिधिसभा ${years.hor} र स्थानीय निकाय ${years.local} को नतिजा।`}
          </p>
          <div className="mt-5 inline-flex rounded-full bg-black/20 p-1 backdrop-blur">
            {(
              [
                ["home", "होम"],
                ["hor", "प्रतिनिधिसभा"],
                ["local", "स्थानीय"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={
                  tab === id
                    ? "rounded-full bg-white px-4 py-2 text-sm font-bold text-crimson"
                    : "rounded-full px-4 py-2 text-sm font-semibold text-white/85"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={`grid gap-3 p-5 sm:p-6 ${tab === "home" ? "sm:grid-cols-2" : ""}`}>
          {tab !== "local" ? (
          <label className="text-sm font-semibold">
            क्षेत्र
            <select
              value={seatId}
              onChange={(e) => {
                setSeatId(e.target.value);
                if (e.target.value) setTab("hor");
              }}
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#faf7f2] px-4 py-3 text-sm outline-none transition focus:border-crimson focus:ring-2 focus:ring-crimson/15"
            >
              <option value="">क्षेत्र छान्नुहोस्</option>
              {seats.map((s) => (
                <option key={s.id} value={s.id}>{seatLabel(s, "np")}</option>
              ))}
            </select>
          </label>
          ) : null}
          {tab !== "hor" ? (
          <label className="text-sm font-semibold">
            पालिका
            <select
              value={palikaId}
              onChange={(e) => {
                setPalikaId(e.target.value);
                if (e.target.value) setTab("local");
              }}
              className="mt-1.5 w-full rounded-2xl border border-line bg-[#faf7f2] px-4 py-3 text-sm outline-none transition focus:border-crimson focus:ring-2 focus:ring-crimson/15"
            >
              <option value="">पालिका छान्नुहोस्</option>
              {locals.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          ) : null}
        </div>
        {mapPin ? (
          <div className="px-5 pb-5 sm:px-6">
            <MapCard title={mapPin.title} lat={mapPin.lat} lng={mapPin.lng} />
          </div>
        ) : null}
      </section>

      {tab === "home" ? (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="क्षेत्र" value={formatInt(4)} />
            <Stat label="घोषित क्षेत्र" value={formatInt(seats.filter((s) => s.winnerName).length)} />
            <Stat label="पालिका" value={formatInt(locals.length)} />
            <Stat label="घोषित पालिका" value={formatInt(locals.filter((b) => b.winnerName).length)} />
          </dl>
          <ul className="grid gap-3 sm:grid-cols-2">
            {seats.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSeatId(s.id);
                    setTab("hor");
                  }}
                  className="w-full rounded-[1.4rem] bg-white p-5 text-left shadow-[0_8px_24px_rgba(27,20,16,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(155,28,44,0.12)]"
                >
                  <p className="text-[11px] font-bold tracking-wide text-crimson">प्रतिनिधिसभा</p>
                  <p className="mt-1 font-display text-2xl">{seatLabel(s, "np")}</p>
                  <p className="mt-1 text-sm text-muted">{s.winnerName || "नतिजा आउन बाँकी"}</p>
                </button>
              </li>
            ))}
          </ul>
          {embedEnabled(data) ? <ElectionEmbedCode /> : null}
        </>
      ) : null}

      {tab === "hor" && seat ? <SeatPanel seat={seat} /> : null}
      {tab === "local" && palika ? <PalikaPanel body={palika} /> : null}
    </div>
  );
}

function SeatPanel({ seat }: { seat: Constituency }) {
  return (
    <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_12px_40px_rgba(27,20,16,0.06)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-crimson">प्रतिनिधिसभा · बारा</p>
          <Link to="/election/$id" params={{ id: seat.id }} className="font-display text-2xl hover:text-crimson">
            {seatLabel(seat, "np")}
          </Link>
        </div>
        <span className="rounded-full bg-crimson/10 px-3 py-1 text-[11px] font-bold text-crimson">
          {statusLabel(seat.status || (seat.winnerName ? "declared" : "pending"))}
        </span>
      </div>
      <CandidateList candidates={ranked(seat.candidates)} />
    </div>
  );
}

function PalikaPanel({ body }: { body: LocalBody }) {
  return (
    <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_12px_40px_rgba(27,20,16,0.06)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-crimson">
            {LOCAL_POSTS.find((p) => p.id === body.post)?.label ?? body.post}
            {body.ward ? ` · वडा ${body.ward}` : ""}
          </p>
          <Link to="/election/local/$id" params={{ id: body.id }} className="font-display text-2xl hover:text-crimson">
            {body.name}
          </Link>
        </div>
        <span className="rounded-full bg-crimson/10 px-3 py-1 text-[11px] font-bold text-crimson">
          {statusLabel(body.status || (body.winnerName ? "declared" : "pending"))}
        </span>
      </div>
      <CandidateList candidates={ranked(body.candidates)} />
    </div>
  );
}

function MapCard({ title, lat, lng, span }: { title: string; lat: number; lng: number; span?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <p className="bg-[#faf7f2] px-4 py-2 text-sm font-semibold">{title} · नक्सा</p>
      <iframe title={title} src={osmEmbed(lat, lng, span ?? 0.09)} className="h-64 w-full border-0 sm:h-80" loading="lazy" />
    </div>
  );
}

function CandidateList({ candidates }: { candidates: Candidate[] }) {
  if (!candidates.length) {
    return <p className="mt-4 text-sm text-muted">उम्मेदवार र मत अद्यावधिक हुन बाँकी।</p>;
  }
  const max = Math.max(...candidates.map((c) => c.votes), 1);
  return (
    <ol className="mt-5 space-y-2">
      {candidates.map((c, i) => (
        <li key={c.id || `${c.name}-${i}`} className="flex items-center gap-3 rounded-2xl bg-[#faf7f2] px-3 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-crimson shadow-sm">
            {formatInt(i + 1)}
          </span>
          {c.photo ? <img src={c.photo} alt="" className="size-10 shrink-0 rounded-full object-cover" /> : null}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {c.name}
              {c.winner ? <span className="ml-1 text-[11px] font-bold text-[#14934e]">विजयी</span> : null}
            </p>
            <p className="truncate text-xs text-muted">{partyShort(c.party, c.partySlug)}</p>
            {c.votes ? (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-gradient-to-r from-[#9B1C2C] to-[#c2410c]" style={{ width: `${Math.round((c.votes / max) * 100)}%` }} />
              </div>
            ) : null}
          </div>
          <span className="shrink-0 text-sm tabular-nums font-semibold">{c.votes ? formatInt(c.votes) : "—"}</span>
        </li>
      ))}
    </ol>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(27,20,16,0.05)]">
      <p className="text-[11px] font-bold tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-crimson">{value}</p>
    </div>
  );
}
