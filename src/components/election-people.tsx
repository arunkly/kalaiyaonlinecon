import { Link } from "@tanstack/react-router";
import { politiciansOf, type ElectionData, type Politician } from "@/lib/election";

export function sortedPoliticians(data: ElectionData): Politician[] {
  return [...politiciansOf(data)].sort((a, b) =>
    a.name.localeCompare(b.name, "ne", { sensitivity: "base" }),
  );
}

export function PoliticiansReel({ data }: { data: ElectionData }) {
  const people = sortedPoliticians(data);
  if (!people.length) return null;
  const loop = people.length < 8 ? [...people, ...people, ...people] : [...people, ...people];
  const seconds = Math.max(18, loop.length * 2.2);
  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-gradient-to-r from-[#1a0a0c] via-[#9B1C2C] to-[#c2410c] px-3 py-3 sm:px-4">
      <p className="px-1 text-[11px] font-bold tracking-[0.2em] text-white/70">राजनीतिज्ञ</p>
      <div className="mt-2 overflow-hidden" style={{ maskImage: "linear-gradient(90deg,transparent,black 6%,black 94%,transparent)" }}>
        <ul
          className="flex w-max gap-5 pr-5 hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ animation: `people-scroll ${seconds}s linear infinite` }}
        >
          {loop.map((p, i) => (
            <li key={`${p.id}-${i}`} className="w-16 shrink-0">
              <Link to="/politician/$id" params={{ id: p.id }} className="flex flex-col items-center gap-1.5">
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="size-12 rounded-full object-cover ring-2 ring-white/80 sm:size-14"
                  />
                ) : (
                  <span className="grid size-12 place-items-center rounded-full bg-white/15 text-sm font-bold text-white ring-2 ring-white/80 sm:size-14">
                    {p.name.slice(0, 1)}
                  </span>
                )}
                <span className="w-full truncate text-center text-[10px] font-semibold text-white/95">{p.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PoliticiansSidebar({ data }: { data: ElectionData }) {
  const people = sortedPoliticians(data);
  return (
    <aside className="rounded-[1.5rem] border border-line bg-white p-4 lg:sticky lg:top-24">
      <h2 className="font-display text-xl">राजनीतिज्ञ</h2>
      <p className="mt-1 text-xs text-muted">अकारादि क्रम</p>
      {people.length ? (
        <ul className="mt-4 divide-y divide-line">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                to="/politician/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 py-2.5 hover:text-crimson"
              >
                {p.photo ? (
                  <img src={p.photo} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-chip text-sm font-bold text-crimson">
                    {p.name.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {[p.post, p.party].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">प्रोफाइल थपिएको छैन।</p>
      )}
    </aside>
  );
}
