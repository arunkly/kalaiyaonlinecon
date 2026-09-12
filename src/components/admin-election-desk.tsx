import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  GENDERS,
  LOCAL_BODY_TYPES,
  LOCAL_POSTS,
  SEAT_STATUS,
  baraLocals,
  baraSeats,
  electionYears,
  normalizeStatus,
  politiciansOf,
  seatLabel,
  type Candidate,
  type Constituency,
  type ElectionData,
  type LocalBody,
  type Politician,
} from "@/lib/election";
import {
  deleteLocalBody,
  deletePolitician,
  getElectionDesk,
  saveConstituency,
  saveLocalBody,
  savePolitician,
  setElectionFrontPage,
  setElectionSettings,
} from "@/lib/election-desk";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-crimson";

type DeskTab = "home" | "hor" | "local" | "people";

function emptyCand(): Candidate {
  return { id: "", name: "", party: "", partySlug: "", votes: 0, winner: false, meta: "", photo: "", bio: "", symbol: "", age: "", gender: "" };
}

function emptyLocal(): LocalBody {
  return { id: "", name: "", districtEn: "Bara", districtNp: "बारा", type: "nagarpalika", post: "chief", ward: "", status: "pending", candidates: [], winnerName: "", winnerParty: "", winnerVotes: 0 };
}

const NEW_LOCAL = emptyLocal();

export function ElectionDeskPanel() {
  const [desk, setDesk] = useState<ElectionData | null>(null);
  const [tab, setTab] = useState<DeskTab>("hor");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    void getElectionDesk()
      .then(setDesk)
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  if (!desk) return <div className="h-40 animate-pulse rounded-2xl bg-chip" />;

  const seats = baraSeats(desk);
  const locals = baraLocals(desk);
  const people = politiciansOf(desk);

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">निर्वाचन डेस्क</h2>
      <p className="text-sm text-muted">बारा जिल्ला — प्रतिनिधिसभा ४ क्षेत्र र स्थानीय निकायको नतिजा अपडेट।</p>
      {msg ? <p className="text-sm font-semibold text-[#14934e]">{msg}</p> : null}
      {err ? <p className="text-sm text-mark">{err}</p> : null}

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            ["home", "होम"],
            ["hor", "प्रतिनिधिसभा"],
            ["local", "स्थानीय निकाय"],
            ["people", "राजनीतिज्ञ"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper"
                : "rounded-full border border-line px-4 py-2 text-sm"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "home" ? (
        <HomeSettings
          desk={desk}
          busy={busy}
          onFront={(mode) => {
            setBusy(true);
            setErr(null);
            void setElectionFrontPage({ data: { frontPage: mode } })
              .then((next) => {
                setDesk(next);
                setMsg("सुरुको दृश्य सेभ भयो।");
              })
              .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
              .finally(() => setBusy(false));
          }}
          onMeta={(payload) => {
            setBusy(true);
            setErr(null);
            void setElectionSettings({ data: payload })
              .then((next) => {
                setDesk(next);
                setMsg("सेटिङ सेभ भयो।");
              })
              .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
              .finally(() => setBusy(false));
          }}
        />
      ) : null}

      {tab === "hor" ? (
        <div className="space-y-6">
          {seats.map((seat) => (
            <SeatEditor
              key={seat.id}
              seat={seat}
              busy={busy}
              onSave={(payload) => {
                setBusy(true);
                setErr(null);
                void saveConstituency({ data: payload })
                  .then((next) => {
                    setDesk(next);
                    setMsg(`${seatLabel(seat, "np")} सेभ भयो।`);
                  })
                  .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
                  .finally(() => setBusy(false));
              }}
            />
          ))}
        </div>
      ) : null}

      {tab === "local" ? (
        <div className="space-y-6">
          <LocalEditor
            body={NEW_LOCAL}
            busy={busy}
            isNew
            onSave={(payload) => {
              setBusy(true);
              setErr(null);
              void saveLocalBody({ data: payload })
                .then((next) => {
                  setDesk(next);
                  setMsg(`${payload.name} थपियो।`);
                })
                .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
                .finally(() => setBusy(false));
            }}
            onDelete={() => undefined}
          />
          {locals.map((body) => (
            <LocalEditor
              key={body.id}
              body={body}
              busy={busy}
              onSave={(payload) => {
                setBusy(true);
                setErr(null);
                void saveLocalBody({ data: payload })
                  .then((next) => {
                    setDesk(next);
                    setMsg(`${payload.name} सेभ भयो।`);
                  })
                  .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
                  .finally(() => setBusy(false));
              }}
              onDelete={() => {
                if (!window.confirm(`${body.name} मेट्ने?`)) return;
                setBusy(true);
                void deleteLocalBody({ data: { id: body.id } })
                  .then(setDesk)
                  .finally(() => setBusy(false));
              }}
            />
          ))}
        </div>
      ) : null}

      {tab === "people" ? (
        <PeopleEditor
          people={people}
          busy={busy}
          onSave={(row) => {
            setBusy(true);
            setErr(null);
            void savePolitician({ data: row })
              .then((next) => {
                setDesk(next);
                setMsg("प्रोफाइल सेभ भयो।");
              })
              .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
              .finally(() => setBusy(false));
          }}
          onDelete={(id) => {
            setBusy(true);
            void deletePolitician({ data: { id } })
              .then(setDesk)
              .finally(() => setBusy(false));
          }}
        />
      ) : null}
    </section>
  );
}

function SeatEditor({
  seat,
  busy,
  onSave,
}: {
  seat: Constituency;
  busy: boolean;
  onSave: (payload: { id: string; candidates: Candidate[]; status?: "pending" | "counting" | "declared"; votesCounted?: number; voters?: number; invalidVotes?: number }) => void;
}) {
  const [rows, setRows] = useState(seat.candidates);
  const [status, setStatus] = useState(normalizeStatus(seat.status));
  const [votesCounted, setVotesCounted] = useState(seat.votesCounted || 0);
  const [voters, setVoters] = useState(seat.voters || 0);
  const [invalidVotes, setInvalidVotes] = useState(seat.invalidVotes || 0);
  useEffect(() => {
    setRows(seat.candidates);
    setStatus(normalizeStatus(seat.status));
    setVotesCounted(seat.votesCounted || 0);
    setVoters(seat.voters || 0);
    setInvalidVotes(seat.invalidVotes || 0);
  }, [seat]);
  return (
    <div className="rounded-2xl border border-line p-4">
      <h3 className="font-display text-xl">{seatLabel(seat, "np")}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium">
          स्थिति
          <select value={status} onChange={(e) => setStatus(normalizeStatus(e.target.value))} className={field}>
            {SEAT_STATUS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          मतदाता
          <input type="number" min={0} value={voters} onChange={(e) => setVoters(Number(e.target.value) || 0)} className={field} />
        </label>
        <label className="text-sm font-medium">
          गणना मत
          <input type="number" min={0} value={votesCounted} onChange={(e) => setVotesCounted(Number(e.target.value) || 0)} className={field} />
        </label>
        <label className="text-sm font-medium">
          बदर मत
          <input type="number" min={0} value={invalidVotes} onChange={(e) => setInvalidVotes(Number(e.target.value) || 0)} className={field} />
        </label>
      </div>
      <CandidateFields rows={rows} setRows={setRows} />
      <button
        type="button"
        disabled={busy}
        onClick={() => onSave({ id: seat.id, candidates: rows.filter((r) => r.name.trim()), status: normalizeStatus(status), votesCounted, voters, invalidVotes })}
        className="mt-3 inline-flex min-h-10 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
      >
        क्षेत्र सेभ
      </button>
    </div>
  );
}

function LocalEditor({
  body,
  busy,
  onSave,
  onDelete,
  isNew,
}: {
  body: LocalBody;
  busy: boolean;
  isNew?: boolean;
  onSave: (payload: { id?: string; name: string; type: string; post: string; ward?: string; status?: "pending" | "counting" | "declared"; candidates: Candidate[] }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(body.name);
  const [type, setType] = useState(body.type);
  const [post, setPost] = useState(body.post);
  const [ward, setWard] = useState(body.ward);
  const [status, setStatus] = useState(normalizeStatus(body.status));
  const [rows, setRows] = useState(body.candidates);
  useEffect(() => {
    setName(body.name);
    setType(body.type);
    setPost(body.post);
    setWard(body.ward);
    setStatus(normalizeStatus(body.status));
    setRows(body.candidates);
  }, [body]);
  return (
    <div className="rounded-2xl border border-line p-4">
      <h3 className="font-display text-xl">{isNew ? "नयाँ निकाय" : body.name}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          निकाय
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-medium">
          प्रकार
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            {LOCAL_BODY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          पद
          <select value={post} onChange={(e) => setPost(e.target.value)} className={field}>
            {LOCAL_POSTS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          वडा (वैकल्पिक)
          <input value={ward} onChange={(e) => setWard(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-medium">
          स्थिति
          <select value={status} onChange={(e) => setStatus(normalizeStatus(e.target.value))} className={field}>
            {SEAT_STATUS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>
      <CandidateFields rows={rows} setRows={setRows} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => onSave({ id: body.id || undefined, name, type, post, ward, status: normalizeStatus(status), candidates: rows.filter((r) => r.name.trim()) })}
          className="inline-flex min-h-10 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {isNew ? "निकाय थप्नुहोस्" : "निकाय सेभ"}
        </button>
        {!isNew ? (
          <button type="button" onClick={onDelete} className="text-sm font-semibold text-mark">
            मेट्नुहोस्
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CandidateFields({
  rows,
  setRows,
}: {
  rows: Candidate[];
  setRows: (rows: Candidate[]) => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      {rows.map((row, i) => (
        <div key={row.id || i} className="grid gap-2 rounded-xl bg-paper p-3 sm:grid-cols-2">
          <input
            value={row.name}
            placeholder="नाम"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, name: e.target.value } : r)))}
            className={field}
          />
          <input
            value={row.party}
            placeholder="दल"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, party: e.target.value } : r)))}
            className={field}
          />
          <input
            type="number"
            min={0}
            value={row.votes}
            placeholder="मत"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, votes: Number(e.target.value) || 0 } : r)))}
            className={field}
          />
          <input
            value={row.symbol || row.meta || ""}
            placeholder="चिह्न"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, symbol: e.target.value, meta: e.target.value } : r)))}
            className={field}
          />
          <input
            value={row.photo || ""}
            placeholder="फोटो URL"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, photo: e.target.value } : r)))}
            className={field}
          />
          <input
            value={row.age || ""}
            placeholder="उमेर"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, age: e.target.value } : r)))}
            className={field}
          />
          <select
            value={row.gender || ""}
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, gender: e.target.value } : r)))}
            className={field}
          >
            {GENDERS.map((g) => (
              <option key={g.id || "none"} value={g.id}>{g.label === "—" ? "लिङ्ग" : g.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={row.winner}
              onChange={(e) =>
                setRows(rows.map((r, n) => ({ ...r, winner: n === i ? e.target.checked : false })))
              }
            />
            विजयी
          </label>
          <button
            type="button"
            className="text-left text-sm text-mark"
            onClick={() => setRows(rows.filter((_, n) => n !== i))}
          >
            हटाउनुहोस्
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, emptyCand()])}
        className="text-sm font-semibold text-crimson"
      >
        + उम्मेदवार
      </button>
    </div>
  );
}

function PeopleEditor({
  people,
  busy,
  onSave,
  onDelete,
}: {
  people: Politician[];
  busy: boolean;
  onSave: (row: Politician) => void;
  onDelete: (id: string) => void;
}) {
  const blank: Politician = { id: "", name: "", party: "", partySlug: "", photo: "", bio: "", post: "", place: "बारा", phone: "", email: "", education: "" };
  const [form, setForm] = useState<Politician>(blank);
  const [q, setQ] = useState("");
  const shown = people.filter((p) => `${p.name} ${p.party} ${p.place} ${p.post}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl border border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
          setForm(blank);
        }}
      >
        <h3 className="font-display text-xl">{form.id ? "प्रोफाइल सम्पादन" : "नयाँ राजनीतिज्ञ"}</h3>
        <input value={form.name} required placeholder="नाम" onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        <input value={form.party} placeholder="दल" onChange={(e) => setForm({ ...form, party: e.target.value })} className={field} />
        <input value={form.post} placeholder="पद (सांसद, मेयर…)" onChange={(e) => setForm({ ...form, post: e.target.value })} className={field} />
        <input value={form.place} placeholder="स्थान (बारा-१…)" onChange={(e) => setForm({ ...form, place: e.target.value })} className={field} />
        <input value={form.phone} placeholder="मोबाइल नम्बर" onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
        <input type="email" value={form.email} placeholder="इमेल ठेगाना" onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
        <input value={form.education} placeholder="शैक्षिक योग्यता" onChange={(e) => setForm({ ...form, education: e.target.value })} className={field} />
        <input value={form.photo} placeholder="बाह्य प्रोफाइल फोटो URL" onChange={(e) => setForm({ ...form, photo: e.target.value })} className={field} />
        <textarea value={form.bio} placeholder="संक्षिप्त परिचय" rows={3} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={field} />
        <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center justify-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60">
          प्रोफाइल सेभ
        </button>
      </form>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="प्रोफाइल खोज्नुहोस्" className={field} />
      <ul className="divide-y divide-line">
        {shown.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-3">
            {p.photo ? <img src={p.photo} alt="" className="size-12 rounded-full object-cover" /> : <span className="size-12 rounded-full bg-chip" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.post} · {p.place}</p>
            </div>
            <Link to="/politician/$id" params={{ id: p.id }} className="text-sm text-crimson">
              साइटमा हेर्नुहोस्
            </Link>
            <button type="button" className="text-sm text-crimson" onClick={() => setForm(p)}>सम्पादन</button>
            <button type="button" className="text-sm text-mark" onClick={() => onDelete(p.id)}>मेट्नुहोस्</button>
          </li>
        ))}
        {!shown.length ? <li className="py-3 text-sm text-muted">प्रोफाइल छैन।</li> : null}
      </ul>
    </div>
  );
}

function NoticeEditor({
  notices,
  busy,
  onSave,
  onDelete,
}: {
  notices: { id: string; title: string; body: string }[];
  busy: boolean;
  onSave: (row: { id?: string; title: string; body?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl border border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, body });
          setTitle("");
          setBody("");
        }}
      >
        <h3 className="font-display text-xl">निर्वाचन सूचना</h3>
        <input value={title} required placeholder="शीर्षक" onChange={(e) => setTitle(e.target.value)} className={field} />
        <textarea value={body} placeholder="विवरण" rows={3} onChange={(e) => setBody(e.target.value)} className={field} />
        <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center justify-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60">
          सूचना थप्नुहोस्
        </button>
      </form>
      <ul className="divide-y divide-line">
        {notices.map((n) => (
          <li key={n.id} className="flex items-start justify-between gap-3 py-3">
            <div>
              <p className="font-semibold">{n.title}</p>
              {n.body ? <p className="text-sm text-muted">{n.body}</p> : null}
            </div>
            <button type="button" className="text-sm text-mark" onClick={() => onDelete(n.id)}>मेट्नुहोस्</button>
          </li>
        ))}
        {!notices.length ? <li className="py-3 text-sm text-muted">सूचना छैन।</li> : null}
      </ul>
    </div>
  );
}

function HomeSettings({
  desk,
  busy,
  onFront,
  onMeta,
}: {
  desk: ElectionData;
  busy: boolean;
  onFront: (mode: "home" | "hor" | "local") => void;
  onMeta: (payload: { horYear: string; localYear: string; showEmbed: boolean }) => void;
}) {
  const years = electionYears(desk);
  const [horYear, setHorYear] = useState(years.hor);
  const [localYear, setLocalYear] = useState(years.local);
  const [showEmbed, setShowEmbed] = useState(desk.showEmbed !== false);
  useEffect(() => {
    setHorYear(years.hor);
    setLocalYear(years.local);
    setShowEmbed(desk.showEmbed !== false);
  }, [desk, years.hor, years.local]);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">निर्वाचन अपडेट खोल्दा पहिले के देखाउने?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {([
            ["home", "होम"],
            ["hor", "प्रतिनिधिसभा"],
            ["local", "स्थानीय निकाय"],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              disabled={busy}
              onClick={() => onFront(mode)}
              className={
                (desk.frontPage || "home") === mode
                  ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper"
                  : "rounded-full border border-line px-4 py-2 text-sm"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <form
        className="grid gap-3 rounded-2xl border border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onMeta({ horYear, localYear, showEmbed });
        }}
      >
        <h3 className="font-display text-xl">वर्ष र एम्बेड</h3>
        <label className="text-sm font-medium">
          प्रतिनिधिसभा निर्वाचन वर्ष
          <input value={horYear} onChange={(e) => setHorYear(e.target.value)} className={field} placeholder="२०८२" />
        </label>
        <label className="text-sm font-medium">
          स्थानीय निकाय निर्वाचन वर्ष
          <input value={localYear} onChange={(e) => setLocalYear(e.target.value)} className={field} placeholder="२०७९" />
        </label>
        <div>
          <p className="text-sm font-medium">एम्बेड कोड</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowEmbed(true)}
              className={showEmbed ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper" : "rounded-full border border-line px-4 py-2 text-sm"}
            >
              देखाउने
            </button>
            <button
              type="button"
              onClick={() => setShowEmbed(false)}
              className={!showEmbed ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper" : "rounded-full border border-line px-4 py-2 text-sm"}
            >
              नदेखाउने
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center justify-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60">
          सेटिङ सेभ
        </button>
      </form>
    </div>
  );
}
