import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ElectionProvider, useElection } from "@/lib/election-live";
import { formatInt, getConstituency, osmEmbed, partyShort, partyTone, pct, seatCoords, seatLabel, statusLabel } from "@/lib/election";

export const Route = createFileRoute("/election/$id")({ component: SeatRoute });

function SeatRoute() {
  return (
    <ElectionProvider>
      <SeatPage />
    </ElectionProvider>
  );
}

function SeatPage() {
  const { id } = Route.useParams();
  const { data } = useElection();
  const seat = getConstituency(id, data);

  if (!seat) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">क्षेत्र भेटिएन।</p>
        <Link to="/election" className="mt-4 inline-block text-sm text-crimson">
          निर्वाचन अपडेट
        </Link>
      </div>
    );
  }

  const ranked = [...seat.candidates].sort((a, b) => b.votes - a.votes);
  const maxVotes = Math.max(...ranked.map((c) => c.votes), 1);
  const turnout = seat.voters > 0 ? pct(seat.votesCounted, seat.voters) : 0;
  const others = data.constituencies.filter((c) => c.districtEn === "Bara" && c.id !== seat.id);
  const pin = seatCoords(seat.seat);

  return (
    <div className="space-y-6">
      <Link to="/election" className="inline-flex items-center gap-2 text-sm text-muted hover:text-crimson">
        <ArrowLeft className="size-4" />
        बाराका ४ क्षेत्र
      </Link>
      <section className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <p className="text-xs font-bold tracking-[0.16em] text-crimson">बारा जिल्ला · प्रतिनिधिसभा</p>
        <h1 className="mt-2 font-display text-4xl">{seatLabel(seat, "np")}</h1>
        <p className="mt-3 text-xs text-muted">{statusLabel(seat.status || (seat.winnerName ? "declared" : "pending"))}</p>
        <p className="font-display text-2xl">{seat.winnerName || "नतिजा आउन बाँकी"}</p>
        <p className="text-sm text-muted">{partyShort(seat.winnerParty, seat.winnerPartySlug)}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="प्राप्त मत" value={formatInt(seat.winnerVotes)} />
          <Stat label="कुल गणना" value={formatInt(seat.votesCounted)} />
          <Stat label="मतदाता" value={formatInt(seat.voters)} />
          <Stat label="मतदान %" value={`${formatInt(turnout)}%`} />
        </dl>
        <iframe title={seatLabel(seat, "np")} src={osmEmbed(pin.lat, pin.lng)} className="mt-6 h-64 w-full rounded-2xl border-0 sm:h-80" loading="lazy" />
      </section>
      <section className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <h2 className="font-display text-2xl">उम्मेदवार</h2>
        <ul className="mt-4 space-y-3">
          {ranked.map((c, i) => (
            <li key={c.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-chip text-sm font-bold text-crimson">
                  {formatInt(i + 1)}
                </span>
                {c.photo ? (
                  <img src={c.photo} alt="" className="size-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-chip font-bold text-crimson">
                    {c.name.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg">
                    {c.name} {c.winner ? <span className="text-sm text-[#14934e]">विजयी</span> : null}
                  </p>
                  <p className="text-xs text-muted">{partyShort(c.party, c.partySlug)}</p>
                </div>
                <p className="tabular-nums font-semibold">{formatInt(c.votes)}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-chip">
                <div className="h-full rounded-full" style={{ width: `${pct(c.votes, maxVotes)}%`, background: partyTone(c.partySlug, c.winner ? "#14934e" : undefined) }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      {others.length ? (
        <section>
          <h2 className="mb-3 font-display text-xl">अन्य क्षेत्र</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {others.map((c) => (
              <li key={c.id}>
                <Link to="/election/$id" params={{ id: c.id }} className="block rounded-2xl border border-line bg-white p-4 hover:border-crimson">
                  <p className="font-display text-lg">{seatLabel(c, "np")}</p>
                  <p className="text-sm text-muted">{c.winnerName || "नतिजा आउन बाँकी"}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-3 py-3">
      <p className="text-[11px] font-bold text-muted">{label}</p>
      <p className="mt-1 font-display text-xl">{value}</p>
    </div>
  );
}
