import { useMemo, useState } from "react";
import { publicOrigin } from "@/lib/site-url";
import {
  LOCAL_BODY_TYPES,
  baraLocals,
  baraSeats,
  electionYears,
  formatInt,
  partyShort,
  seatLabel,
  type Candidate,
  type ElectionData,
} from "@/lib/election";

export function electionEmbedSnippet(origin = publicOrigin()) {
  const src = `${origin}/election/embed`;
  return `<!-- स्रोत: kalaiyaonline.com — बारा निर्वाचन अपडेट -->
<iframe
  src="${src}"
  title="बारा निर्वाचन अपडेट — स्रोत: kalaiyaonline.com"
  style="width:100%;min-height:820px;border:0;border-radius:16px;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
<p style="font-family:Mukta,sans-serif;font-size:12px;margin:8px 0 0;">
  स्रोत: <a href="${origin}/election" target="_blank" rel="noopener">kalaiyaonline.com</a>
</p>`;
}

export function ElectionEmbedCode() {
  const snippet = useMemo(() => electionEmbedSnippet(), []);
  const [copied, setCopied] = useState(false);
  return (
    <section className="rounded-[1.4rem] bg-white p-5 shadow-[0_8px_24px_rgba(27,20,16,0.05)]">
      <p className="text-[11px] font-bold tracking-[0.18em] text-crimson">एम्बेड</p>
      <h2 className="mt-1 font-display text-2xl">आफ्नो वेबसाइटमा राख्नुहोस्</h2>
      <p className="mt-1 text-sm text-muted">यो कोड कपी गरेर साइटमा टाँस्नुहोस्। स्रोत kalaiyaonline.com हुन्छ।</p>
      <textarea
        readOnly
        value={snippet}
        rows={10}
        className="mt-3 w-full rounded-2xl border border-line bg-[#faf7f2] px-3 py-3 font-mono text-[11px] leading-relaxed"
      />
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(snippet).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          });
        }}
        className="mt-3 inline-flex min-h-10 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper"
      >
        {copied ? "कपी भयो" : "कोड कपी गर्नुहोस्"}
      </button>
    </section>
  );
}

function ranked(candidates: Candidate[]) {
  return [...candidates].sort((a, b) => b.votes - a.votes);
}

export function ElectionEmbedBoard({ data }: { data: ElectionData }) {
  const seats = baraSeats(data);
  const locals = baraLocals(data);
  const years = electionYears(data);
  const [tab, setTab] = useState<"hor" | "local">("hor");
  const origin = publicOrigin();
  return (
    <div className="min-h-dvh bg-[#faf7f2] p-3 text-ink sm:p-4">
      <header className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#9B1C2C] to-[#c2410c] px-4 py-3 text-white">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-white/75">बारा जिल्ला</p>
          <p className="font-display text-xl">निर्वाचन अपडेट</p>
          <p className="text-[11px] text-white/80">
            प्रतिनिधिसभा {years.hor} · स्थानीय {years.local}
          </p>
        </div>
        <a href={`${origin}/election`} target="_blank" rel="noopener" className="text-right text-[11px] font-semibold text-white/95">
          स्रोत
          <span className="mt-0.5 block text-xs">kalaiyaonline.com</span>
        </a>
      </header>
      <div className="mb-3 inline-flex rounded-full bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setTab("hor")} className={tab === "hor" ? "rounded-full bg-crimson px-4 py-1.5 text-sm font-bold text-paper" : "rounded-full px-4 py-1.5 text-sm"}>
          प्रतिनिधिसभा {years.hor}
        </button>
        <button type="button" onClick={() => setTab("local")} className={tab === "local" ? "rounded-full bg-crimson px-4 py-1.5 text-sm font-bold text-paper" : "rounded-full px-4 py-1.5 text-sm"}>
          स्थानीय {years.local}
        </button>
      </div>
      {tab === "hor" ? (
        <ul className="space-y-3">
          {seats.map((s) => (
            <li key={s.id} className="rounded-2xl bg-white p-4">
              <p className="font-display text-lg">{seatLabel(s, "np")}</p>
              <CompactList candidates={ranked(s.candidates)} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {locals.map((b) => (
            <li key={b.id} className="rounded-2xl bg-white p-4">
              <p className="text-[11px] text-muted">{LOCAL_BODY_TYPES.find((t) => t.id === b.type)?.label}</p>
              <p className="font-display text-lg">{b.name}</p>
              <CompactList candidates={ranked(b.candidates)} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-center text-xs text-muted">
        स्रोत: <a className="font-semibold text-crimson" href={`${origin}/election`} target="_blank" rel="noopener">kalaiyaonline.com</a>
      </p>
    </div>
  );
}

function CompactList({ candidates }: { candidates: Candidate[] }) {
  if (!candidates.length) return <p className="mt-2 text-xs text-muted">नतिजा आउन बाँकी</p>;
  return (
    <ol className="mt-2 space-y-1.5">
      {candidates.map((c, i) => (
        <li key={c.id || i} className="flex items-center gap-2 text-sm">
          <span className="w-5 text-xs font-bold text-crimson">{formatInt(i + 1)}</span>
          <span className="min-w-0 flex-1 truncate">
            {c.name}
            {c.winner ? <span className="ml-1 text-[10px] font-bold text-[#14934e]">विजयी</span> : null}
            <span className="ml-1 text-[11px] text-muted">{partyShort(c.party, c.partySlug)}</span>
          </span>
          <span className="tabular-nums text-xs">{c.votes ? formatInt(c.votes) : "—"}</span>
        </li>
      ))}
    </ol>
  );
}
