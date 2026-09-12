import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ElectionProvider, useElection } from "@/lib/election-live";
import { LOCAL_BODY_TYPES, LOCAL_POSTS, formatInt, localBodiesOf, osmEmbed, palikaCoords, partyTone, pct, statusLabel } from "@/lib/election";

export const Route = createFileRoute("/election/local/$id")({ component: LocalRoute });

function LocalRoute() {
  return (
    <ElectionProvider>
      <LocalPage />
    </ElectionProvider>
  );
}

function LocalPage() {
  const { id } = Route.useParams();
  const { data } = useElection();
  const body = localBodiesOf(data).find((b) => b.id === id);
  if (!body) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">स्थानीय तह भेटिएन।</p>
        <Link to="/election" className="mt-4 inline-block text-sm text-crimson">
          निर्वाचन अपडेट
        </Link>
      </div>
    );
  }
  const ranked = [...body.candidates].sort((a, b) => b.votes - a.votes);
  const maxVotes = Math.max(...ranked.map((c) => c.votes), 1);
  const typeLabel = LOCAL_BODY_TYPES.find((t) => t.id === body.type)?.label ?? body.type;
  const postLabel = LOCAL_POSTS.find((p) => p.id === body.post)?.label ?? body.post;
  const pin = palikaCoords(body.id);

  return (
    <div className="space-y-6">
      <Link to="/election" className="inline-flex items-center gap-2 text-sm text-muted hover:text-crimson">
        <ArrowLeft className="size-4" />
        स्थानीय निकाय
      </Link>
      <section className="rounded-[1.5rem] bg-white p-5 sm:p-8">
        <p className="text-xs font-bold tracking-[0.16em] text-crimson">
          बारा · {typeLabel}
          {body.ward ? ` · वडा ${body.ward}` : ""}
        </p>
        <h1 className="mt-2 font-display text-4xl">{body.name}</h1>
        <p className="mt-2 text-sm text-muted">{postLabel}</p>
        <p className="mt-2 text-xs font-bold">{statusLabel(body.status || (body.winnerName ? "declared" : "pending"))}</p>
        <p className="mt-2 font-display text-2xl">{body.winnerName || "नतिजा आउन बाँकी"}</p>
        <iframe title={body.name} src={osmEmbed(pin.lat, pin.lng)} className="mt-6 h-64 w-full rounded-2xl border-0 sm:h-80" loading="lazy" />
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
                  <p className="text-xs text-muted">{c.party}</p>
                </div>
                <p className="tabular-nums font-semibold">{formatInt(c.votes)}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-chip">
                <div className="h-full rounded-full" style={{ width: `${pct(c.votes, maxVotes)}%`, background: partyTone(c.partySlug) }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
