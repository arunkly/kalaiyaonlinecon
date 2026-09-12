import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type AppNotice = {
  id: string;
  kind: "post" | "gallery" | "chat" | "friend";
  title: string;
  href: string;
  at: string;
};

export const listPublicNotices = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const stories = await sql<{ slug: string; title: string; createdAt: string }>`
    select slug, title, created_at as "createdAt"
    from desk_stories
    where published = true and deleted_at is null
    order by created_at desc
    limit 8
  `;
  const albums = await sql<{ slug: string; title: string; createdAt: string }>`
    select slug, title, created_at as "createdAt"
    from gallery_posts
    order by created_at desc
    limit 6
  `;
  return [
    ...stories.map((s) => ({
      id: `story-${s.slug}`,
      kind: "post" as const,
      title: `नयाँ समाचार: ${s.title}`,
      href: `/article/${s.slug}`,
      at: s.createdAt,
    })),
    ...albums.map((s) => ({
      id: `gal-${s.slug}`,
      kind: "gallery" as const,
      title: `नयाँ ग्यालरी: ${s.title}`,
      href: `/gallery/${s.slug}`,
      at: s.createdAt,
    })),
  ] satisfies AppNotice[];
});

export const listMyNotices = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const messages = await sql<{ id: number; fromId: string; body: string; createdAt: string }>`
      select id, from_id as "fromId", body, created_at as "createdAt"
      from chat_messages
      where to_id = ${context.userId}
      order by created_at desc
      limit 12
    `;
    const friends = await sql<{ userId: string; createdAt: string }>`
      select user_id as "userId", created_at as "createdAt"
      from friend_links
      where peer_id = ${context.userId} and status = 'pending'
      order by created_at desc
      limit 8
    `;
    const users = await sql<{ id: string; name: string | null; email: string | null }>`
      select id, name, email from "user"
    `;
    const nameOf = (id: string) =>
      users.find((u) => u.id === id)?.name ||
      users.find((u) => u.id === id)?.email?.split("@")[0] ||
      "सदस्य";

    const notices: AppNotice[] = [
      ...messages.map((m) => ({
        id: `msg-${m.id}`,
        kind: "chat" as const,
        title: `${nameOf(m.fromId)}: ${m.body.slice(0, 48)}`,
        href: "/chat",
        at: m.createdAt,
      })),
      ...friends.map((f) => ({
        id: `fr-${f.userId}`,
        kind: "friend" as const,
        title: `${nameOf(f.userId)} को साथी अनुरोध`,
        href: "/chat",
        at: f.createdAt,
      })),
    ];
    return notices;
  });
