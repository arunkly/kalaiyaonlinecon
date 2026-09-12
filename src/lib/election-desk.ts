import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";
import { election, hydrateElection, normalizeStatus, syncLocalBody, syncSeat, type Candidate, type ElectionData, type LocalBody, type Party, type Politician } from "@/lib/election";

const RESULTS_URL =
  "https://election.onlinekhabar.com/wp-json/okelapi/v1/2082/home/election-results?limit=40";

type FeedParty = {
  party_id?: number | string;
  party_name?: string;
  party_nickname?: string;
  party_slug?: string;
  party_color?: string;
  leading_count?: number | string;
  winner_count?: number | string;
  samanupatik?: number | string;
  samanupatik_seat?: number | string;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists election_desk (
      id text primary key,
      payload text not null,
      updated_at timestamptz default now()
    )
  `;
  return sql;
}

export async function readElectionDesk(): Promise<ElectionData> {
  try {
    const sql = await ensureTable();
    const rows = await sql<{ payload: string }>`select payload from election_desk where id = ${"main"}`;
    if (!rows[0]?.payload) {
      const payload = JSON.stringify(hydrateElection(election));
      await sql`
        insert into election_desk (id, payload) values (${"main"}, ${payload})
        on conflict (id) do nothing
      `;
      return hydrateElection(structuredClone(election));
    }
    return hydrateElection(JSON.parse(rows[0].payload) as ElectionData);
  } catch {
    return hydrateElection(structuredClone(election));
  }
}

async function writeElectionDesk(data: ElectionData) {
  const sql = await ensureTable();
  const payload = JSON.stringify(data);
  try {
    await sql`
      insert into election_desk (id, payload, updated_at)
      values (${"main"}, ${payload}, now())
      on conflict (id) do update set payload = excluded.payload, updated_at = now()
    `;
  } catch (err) {
    throw new Error(err instanceof Error ? `सेभ भएन: ${err.message}` : "सेभ भएन।");
  }
}

function mergeParties(current: Party[], incoming: FeedParty[]): Party[] {
  const bySlug = new Map(current.map((p) => [p.slug, { ...p }]));
  for (const row of incoming) {
    const slug = String(row.party_slug || "").trim();
    if (!slug) continue;
    const won = num(row.winner_count);
    const leading = num(row.leading_count);
    const prev = bySlug.get(slug);
    if (prev) {
      prev.won = won;
      prev.leading = leading;
      prev.seats = won;
      prev.proportionalVotes = num(row.samanupatik) || prev.proportionalVotes;
      prev.proportionalSeats = num(row.samanupatik_seat) || prev.proportionalSeats;
      if (row.party_nickname) prev.nick = String(row.party_nickname);
      if (row.party_name) prev.name = String(row.party_name);
    } else {
      bySlug.set(slug, {
        id: row.party_id ?? slug,
        name: String(row.party_name || slug),
        nick: String(row.party_nickname || row.party_name || slug),
        slug,
        color: String(row.party_color || "#14934E"),
        leading,
        won,
        seats: won,
        proportionalVotes: num(row.samanupatik),
        proportionalSeats: num(row.samanupatik_seat),
        won2079: 0,
      });
    }
  }
  return [...bySlug.values()].sort((a, b) => b.won - a.won || b.leading - a.leading);
}

const globalRef = globalThis as typeof globalThis & {
  __koLiveSyncAt__?: number;
  __koLiveSyncPromise__?: Promise<{ ok: true; paused: boolean; at: string; desk: ElectionData }>;
};

export const getElectionDesk = createServerFn({ method: "GET" }).handler(async () => readElectionDesk());

export const syncElectionFeed = createServerFn({ method: "POST" }).handler(async () => {
  const now = Date.now();
  if (globalRef.__koLiveSyncPromise__ && now - (globalRef.__koLiveSyncAt__ ?? 0) < 30_000) {
    return globalRef.__koLiveSyncPromise__;
  }
  const run = (async () => {
    const desk = await readElectionDesk();
    if (desk.live?.enabled === false) {
      return { ok: true as const, paused: true, at: desk.live.at ?? "", desk };
    }
    try {
      const res = await fetch(RESULTS_URL, { headers: { "User-Agent": "KalaiyaOnline-Election/1.0" } });
      if (!res.ok) throw new Error(`feed ${res.status}`);
      const json = (await res.json()) as { data?: { party_results?: FeedParty[]; total?: { leading?: number; win?: number; total_seat?: number; samanupatik?: number } } };
      const feed = { parties: json.data?.party_results ?? [], total: json.data?.total ?? {} };
      desk.parties = mergeParties(desk.parties ?? [], feed.parties);
      desk.national.declaredSeats = num(feed.total.win) || desk.parties.reduce((n, p) => n + p.won, 0);
      desk.national.leadingSeats = num(feed.total.leading);
      desk.national.directSeats = num(feed.total.total_seat) || desk.national.directSeats;
      if (feed.total.samanupatik) desk.national.proportionalVotes = num(feed.total.samanupatik);
      const at = new Date().toISOString();
      desk.updated = at.slice(0, 10);
      desk.live = { enabled: true, at, ok: true };
      await writeElectionDesk(desk);
      return { ok: true as const, paused: false, at, desk };
    } catch {
      desk.live = { enabled: desk.live?.enabled !== false, at: desk.live?.at ?? "", ok: false };
      return { ok: true as const, paused: false, at: desk.live.at, desk };
    }
  })();
  globalRef.__koLiveSyncAt__ = now;
  globalRef.__koLiveSyncPromise__ = run;
  return run;
});

export const setElectionLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ enabled: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    desk.live = { enabled: data.enabled, at: desk.live?.at ?? "", ok: desk.live?.ok ?? false };
    await writeElectionDesk(desk);
    return desk;
  });

function cleanUrl(raw?: string) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function cid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const candidateZ = z.object({
  id: z.string().max(80).optional(),
  name: z.string().max(200).optional(),
  party: z.string().max(120).optional(),
  partySlug: z.string().max(80).optional(),
  votes: z.coerce.number().min(0).max(20_000_000).optional(),
  winner: z.boolean().optional(),
  photo: z.string().max(2000).optional(),
  bio: z.string().max(800).optional(),
  symbol: z.string().max(40).optional(),
  age: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  meta: z.string().max(80).optional(),
});

function asCandidate(row: z.infer<typeof candidateZ>, i: number): Candidate {
  return {
    id: row.id?.trim() || cid(`c${i}`),
    name: (row.name || "").trim(),
    party: row.party?.trim() || "स्वतन्त्र",
    partySlug: row.partySlug?.trim() || "independent",
    votes: Number(row.votes) || 0,
    winner: Boolean(row.winner),
    meta: row.symbol?.trim() || row.meta?.trim() || "",
    photo: cleanUrl(row.photo),
    bio: row.bio?.trim() || "",
    symbol: row.symbol?.trim() || "",
    age: row.age?.trim() || "",
    gender: row.gender?.trim() || "",
  };
}

function namedCandidates(rows: z.infer<typeof candidateZ>[]) {
  return rows.map(asCandidate).filter((row) => row.name);
}

export const saveConstituency = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().min(1).max(40),
      candidates: z.array(candidateZ).max(80),
      status: z.string().max(40).optional(),
      votesCounted: z.coerce.number().min(0).max(20_000_000).optional(),
      voters: z.coerce.number().min(0).max(20_000_000).optional(),
      invalidVotes: z.coerce.number().min(0).max(20_000_000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    const idx = desk.constituencies.findIndex((c) => c.id === data.id);
    if (idx < 0) throw new Error("क्षेत्र भेटिएन।");
    const prev = desk.constituencies[idx];
    desk.constituencies[idx] = syncSeat({
      ...prev,
      status: normalizeStatus(data.status || prev.status),
      votesCounted: data.votesCounted ?? prev.votesCounted,
      voters: data.voters ?? prev.voters,
      invalidVotes: data.invalidVotes ?? prev.invalidVotes,
      candidates: namedCandidates(data.candidates),
    });
    await writeElectionDesk(desk);
    return desk;
  });

export const saveLocalBody = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().max(40).optional(),
      name: z.string().trim().min(2).max(80),
      type: z.string().max(40),
      post: z.string().max(40),
      ward: z.string().max(20).optional(),
      status: z.string().max(40).optional(),
      candidates: z.array(candidateZ).max(80),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    const id = data.id?.trim() || cid("local");
    const body: LocalBody = syncLocalBody({
      id,
      name: data.name,
      districtEn: "Bara",
      districtNp: "बारा",
      type: data.type,
      post: data.post,
      ward: data.ward?.trim() || "",
      status: normalizeStatus(data.status || (data.candidates.some((c) => c.winner) ? "declared" : "pending")),
      candidates: namedCandidates(data.candidates),
      winnerName: "",
      winnerParty: "",
      winnerVotes: 0,
    });
    const list = desk.localBodies ?? [];
    const idx = list.findIndex((b) => b.id === id);
    if (idx >= 0) list[idx] = body;
    else list.push(body);
    desk.localBodies = list;
    await writeElectionDesk(desk);
    return desk;
  });

export const deleteLocalBody = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1).max(40) }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    desk.localBodies = (desk.localBodies ?? []).filter((b) => b.id !== data.id);
    await writeElectionDesk(desk);
    return desk;
  });

export const savePolitician = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().max(40).optional(),
      name: z.string().trim().min(2).max(80),
      party: z.string().max(80).optional(),
      partySlug: z.string().max(80).optional(),
      photo: z.string().max(2000).optional(),
      bio: z.string().max(800).optional(),
      post: z.string().max(80).optional(),
      place: z.string().max(80).optional(),
      phone: z.string().max(20).optional(),
      email: z.string().max(80).optional(),
      education: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    const row: Politician = {
      id: data.id?.trim() || cid("pol"),
      name: data.name,
      party: data.party?.trim() || "",
      partySlug: data.partySlug?.trim() || "independent",
      photo: cleanUrl(data.photo),
      bio: data.bio?.trim() || "",
      post: data.post?.trim() || "",
      place: data.place?.trim() || "बारा",
      phone: data.phone?.trim() || "",
      email: data.email?.trim() || "",
      education: data.education?.trim() || "",
    };
    const list = desk.politicians ?? [];
    const idx = list.findIndex((p) => p.id === row.id);
    if (idx >= 0) list[idx] = row;
    else list.push(row);
    desk.politicians = list;
    await writeElectionDesk(desk);
    return desk;
  });

export const deletePolitician = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1).max(40) }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    desk.politicians = (desk.politicians ?? []).filter((p) => p.id !== data.id);
    await writeElectionDesk(desk);
    return desk;
  });

export const setElectionFrontPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ frontPage: z.enum(["home", "hor", "local"]) }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    desk.frontPage = data.frontPage;
    await writeElectionDesk(desk);
    return desk;
  });

export const setElectionSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      horYear: z.string().trim().min(1).max(20),
      localYear: z.string().trim().min(1).max(20),
      showEmbed: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    desk.years = { hor: data.horYear, local: data.localYear };
    desk.showEmbed = data.showEmbed;
    await writeElectionDesk(desk);
    return desk;
  });

export const saveNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().max(40).optional(), title: z.string().trim().min(2).max(120), body: z.string().max(400).optional() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    const row = { id: data.id?.trim() || cid("note"), title: data.title, body: data.body?.trim() || "" };
    const list = desk.notices ?? [];
    const idx = list.findIndex((n) => n.id === row.id);
    if (idx >= 0) list[idx] = row;
    else list.unshift(row);
    desk.notices = list;
    await writeElectionDesk(desk);
    return desk;
  });

export const deleteNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1).max(40) }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "election");
    const desk = await readElectionDesk();
    desk.notices = (desk.notices ?? []).filter((n) => n.id !== data.id);
    await writeElectionDesk(desk);
    return desk;
  });

