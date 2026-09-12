import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { CHAT_WARN, findBadWord } from "@/lib/chat-filter";

export type SocialUser = {
  id: string;
  name: string;
  email: string | null;
  photo: string | null;
};

export type ChatMessage = {
  id: number;
  fromId: string;
  toId: string;
  body: string;
  createdAt: string;
};

export type FriendRow = {
  id: string;
  name: string;
  photo: string | null;
  status: string;
  incoming: boolean;
};

async function peopleByIds(
  sql: Awaited<ReturnType<typeof import("@/lib/db").getSql>>,
  ids: string[],
) {
  if (!ids.length) return new Map<string, SocialUser>();
  const profiles = await sql<{ userId: string; displayName: string; photoUrl: string }>`
    select user_id as "userId", display_name as "displayName", photo_url as "photoUrl"
    from member_profiles
  `;
  const users = await sql<{ id: string; name: string | null; email: string | null }>`
    select id, name, email from "user"
  `;
  const map = new Map<string, SocialUser>();
  for (const u of users) {
    if (!ids.includes(u.id)) continue;
    const p = profiles.find((x) => x.userId === u.id);
    map.set(u.id, {
      id: u.id,
      name: p?.displayName || u.name || u.email?.split("@")[0] || "सदस्य",
      email: u.email,
      photo: p?.photoUrl || null,
    });
  }
  return map;
}

export const listMembers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const users = await sql<{ id: string; name: string | null; email: string | null }>`
      select id, name, email from "user" where id <> ${context.userId} order by name asc
    `;
    const profiles = await sql<{ userId: string; displayName: string; photoUrl: string }>`
      select user_id as "userId", display_name as "displayName", photo_url as "photoUrl"
      from member_profiles
    `;
    return users.map((u) => {
      const p = profiles.find((x) => x.userId === u.id);
      return {
        id: u.id,
        name: p?.displayName || u.name || u.email?.split("@")[0] || "सदस्य",
        email: u.email,
        photo: p?.photoUrl || null,
      } satisfies SocialUser;
    });
  });

export const listFriends = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ userId: string; peerId: string; status: string }>`
      select user_id as "userId", peer_id as "peerId", status
      from friend_links
      where user_id = ${context.userId} or peer_id = ${context.userId}
    `;
    const ids = rows.map((r) => (r.userId === context.userId ? r.peerId : r.userId));
    const people = await peopleByIds(sql, ids);
    return rows
      .map((r) => {
        const peer = r.userId === context.userId ? r.peerId : r.userId;
        const person = people.get(peer);
        if (!person) return null;
        return {
          id: person.id,
          name: person.name,
          photo: person.photo,
          status: r.status,
          incoming: r.peerId === context.userId && r.status === "pending",
        } satisfies FriendRow;
      })
      .filter(Boolean) as FriendRow[];
  });

export const requestFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ peerId: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    if (data.peerId === context.userId) throw new Error("आफैंलाई साथी बनाउन मिल्दैन।");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into friend_links (user_id, peer_id, status)
      values (${context.userId}, ${data.peerId}, 'pending')
      on conflict (user_id, peer_id) do nothing
    `;
    return { ok: true };
  });

export const acceptFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ peerId: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update friend_links set status = 'accepted'
      where user_id = ${data.peerId} and peer_id = ${context.userId}
    `;
    await sql`
      insert into friend_links (user_id, peer_id, status)
      values (${context.userId}, ${data.peerId}, 'accepted')
      on conflict (user_id, peer_id) do update set status = 'accepted'
    `;
    return { ok: true };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ peerId: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<ChatMessage>`
      select id, from_id as "fromId", to_id as "toId", body, created_at as "createdAt"
      from chat_messages
      where (from_id = ${context.userId} and to_id = ${data.peerId})
         or (from_id = ${data.peerId} and to_id = ${context.userId})
      order by created_at asc
      limit 200
    `;
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ peerId: z.string().min(1).max(80), body: z.string().min(1).max(800) }))
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (findBadWord(data.body)) {
      await sql`
        insert into chat_warnings (user_id, body)
        values (${context.userId}, ${data.body.trim().slice(0, 400)})
      `;
      throw new Error(CHAT_WARN);
    }
    const rows = await sql<ChatMessage>`
      insert into chat_messages (from_id, to_id, body)
      values (${context.userId}, ${data.peerId}, ${data.body.trim()})
      returning id, from_id as "fromId", to_id as "toId", body, created_at as "createdAt"
    `;
    return rows[0];
  });

export const clearChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ peerId: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      delete from chat_messages
      where (from_id = ${context.userId} and to_id = ${data.peerId})
         or (from_id = ${data.peerId} and to_id = ${context.userId})
    `;
    return { ok: true };
  });
