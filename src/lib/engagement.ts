import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasAdminAccess } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type StoryComment = {
  id: number;
  author: string;
  body: string;
  userId: string;
  createdAt: string;
};

export type StoryEngagement = {
  likes: number;
  dislikes: number;
  myVote: number;
  comments: StoryComment[];
};

async function sessionUser() {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  return getSessionUser();
}

function guestVoterId(raw?: string) {
  const value = raw?.trim() ?? "";
  if (/^anon-[a-z0-9-]{8,40}$/i.test(value)) return value;
  return "";
}

async function voterId(guest?: string) {
  const session = await sessionUser();
  if (session?.id) return session.id;
  return guestVoterId(guest);
}

export const getStoryEngagement = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(120), guest: z.string().max(48).optional() }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const voter = await voterId(data.guest);
    const up = await sql<{ n: string }>`
      select count(*)::text as n from desk_votes where slug = ${data.slug} and value = 1
    `;
    const down = await sql<{ n: string }>`
      select count(*)::text as n from desk_votes where slug = ${data.slug} and value = -1
    `;
    let myVote = 0;
    if (voter) {
      const mine = await sql<{ value: number }>`
        select value from desk_votes
        where slug = ${data.slug} and user_id = ${voter}
        limit 1
      `;
      myVote = Number(mine[0]?.value ?? 0);
    }
    const comments = await sql<StoryComment>`
      select id, author, body, user_id as "userId", created_at as "createdAt"
      from desk_comments
      where slug = ${data.slug}
      order by created_at desc
    `;
    return {
      likes: Number(up[0]?.n ?? 0),
      dislikes: Number(down[0]?.n ?? 0),
      myVote,
      comments,
    } satisfies StoryEngagement;
  });

export const castStoryVote = createServerFn({ method: "POST" })
  .validator(
    z.object({
      slug: z.string().min(1).max(120),
      value: z.union([z.literal(1), z.literal(-1)]),
      guest: z.string().max(48).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const voter = await voterId(data.guest);
    if (!voter) throw new Error("भोट गर्न सकिएन।");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const existing = await sql<{ value: number }>`
      select value from desk_votes
      where slug = ${data.slug} and user_id = ${voter}
      limit 1
    `;
    if (existing[0]?.value === data.value) {
      await sql`delete from desk_votes where slug = ${data.slug} and user_id = ${voter}`;
    } else if (existing[0]) {
      await sql`
        update desk_votes set value = ${data.value}
        where slug = ${data.slug} and user_id = ${voter}
      `;
    } else {
      await sql`
        insert into desk_votes (slug, user_id, value)
        values (${data.slug}, ${voter}, ${data.value})
      `;
    }
    return { ok: true };
  });

export const addStoryComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ slug: z.string().min(1).max(120), body: z.string().min(2).max(800) }))
  .handler(async ({ data, context }) => {
    const session = await sessionUser();
    const author = session?.email?.split("@")[0] || "पाठक";
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<StoryComment>`
      insert into desk_comments (slug, user_id, author, body)
      values (${data.slug}, ${context.userId}, ${author}, ${data.body.trim()})
      returning id, author, body, user_id as "userId", created_at as "createdAt"
    `;
    return rows[0];
  });

export const deleteStoryComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    const admin = await hasAdminAccess(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (admin) {
      await sql`delete from desk_comments where id = ${data.id}`;
    } else {
      await sql`delete from desk_comments where id = ${data.id} and user_id = ${context.userId}`;
    }
    return { ok: true };
  });
