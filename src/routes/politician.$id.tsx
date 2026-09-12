import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ElectionProvider, useElection } from "@/lib/election-live";
import { PoliticiansSidebar } from "@/components/election-people";
import { getPolitician } from "@/lib/election";

export const Route = createFileRoute("/politician/$id")({ component: PolRoute });

function PolRoute() {
  return (
    <ElectionProvider>
      <PolPage />
    </ElectionProvider>
  );
}

function PolPage() {
  const { id } = Route.useParams();
  const { data } = useElection();
  const person = getPolitician(id, data);
  if (!person) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">प्रोफाइल भेटिएन।</p>
        <Link to="/election" className="mt-4 inline-block text-sm text-crimson">
          निर्वाचन
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-6">
        <Link to="/election" className="inline-flex items-center gap-2 text-sm text-muted hover:text-crimson">
          <ArrowLeft className="size-4" />
          निर्वाचन अपडेट
        </Link>
        <section className="rounded-[1.5rem] bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            {person.photo ? (
              <img src={person.photo} alt="" className="size-36 rounded-full object-cover ring-4 ring-chip" />
            ) : (
              <span className="grid size-36 place-items-center rounded-full bg-chip font-display text-4xl text-crimson">
                {person.name.slice(0, 1)}
              </span>
            )}
            <div className="mt-4 sm:mt-0 sm:ml-6">
              <p className="text-[11px] font-bold tracking-[0.18em] text-crimson">राजनीतिज्ञ प्रोफाइल</p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl">{person.name}</h1>
              <p className="mt-2 text-sm text-muted">
                {[person.post, person.party, person.place].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {person.phone ? (
              <div className="rounded-2xl bg-paper px-4 py-3">
                <dt className="text-[11px] font-bold text-muted">मोबाइल</dt>
                <dd className="mt-1 text-sm font-semibold">
                  <a href={`tel:${person.phone}`} className="hover:text-crimson">{person.phone}</a>
                </dd>
              </div>
            ) : null}
            {person.email ? (
              <div className="rounded-2xl bg-paper px-4 py-3">
                <dt className="text-[11px] font-bold text-muted">इमेल</dt>
                <dd className="mt-1 break-all text-sm font-semibold">
                  <a href={`mailto:${person.email}`} className="hover:text-crimson">{person.email}</a>
                </dd>
              </div>
            ) : null}
            {person.education ? (
              <div className="rounded-2xl bg-paper px-4 py-3 sm:col-span-1">
                <dt className="text-[11px] font-bold text-muted">शैक्षिक योग्यता</dt>
                <dd className="mt-1 text-sm font-semibold">{person.education}</dd>
              </div>
            ) : null}
          </dl>
          {person.bio ? <p className="mt-6 text-base leading-relaxed text-ink-soft">{person.bio}</p> : null}
        </section>
      </div>
      <PoliticiansSidebar data={data} />
    </div>
  );
}
