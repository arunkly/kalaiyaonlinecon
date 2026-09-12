import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type GalleryCategory = { id: number; slug: string; label: string };
export type GalleryPhoto = { id: number; imageUrl: string; caption: string };
export type GalleryPost = {
  id: number;
  slug: string;
  title: string;
  place: string;
  blurb: string;
  category: string;
  coverUrl: string;
  createdAt: string;
  views?: number;
  photos: GalleryPhoto[];
};

function cleanImageUrl(raw?: string) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("तस्बिरको लिंक सही छैन।");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("तस्बिर https वा http लिंक हुनुपर्छ।");
  }
  return parsed.toString();
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `${base || "gallery"}-${Date.now().toString(36)}`;
}

async function assertAdmin(userId: string) {
  await assertCap(userId, "gallery");
}

async function photosFor(sql: Awaited<ReturnType<typeof import("@/lib/db").getSql>>, ids: number[]) {
  if (!ids.length) return new Map<number, GalleryPhoto[]>();
  const rows = await sql<{ postId: number; id: number; imageUrl: string; caption: string }>`
    select post_id as "postId", id, image_url as "imageUrl", caption
    from gallery_photos
    order by id asc
  `;
  const idSet = new Set(ids);
  const map = new Map<number, GalleryPhoto[]>();
  for (const row of rows) {
    if (!idSet.has(row.postId)) continue;
    const list = map.get(row.postId) ?? [];
    list.push({ id: row.id, imageUrl: row.imageUrl, caption: row.caption });
    map.set(row.postId, list);
  }
  return map;
}

export const listGalleryCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  return sql<GalleryCategory>`
    select id, slug, label from gallery_categories order by id asc
  `;
});

export const listGalleryPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const posts = await sql<Omit<GalleryPost, "photos">>`
    select id, slug, title, place, blurb, category,
           cover_url as "coverUrl", created_at as "createdAt", views
    from gallery_posts
    order by created_at desc
  `;
  const map = await photosFor(sql, posts.map((p) => p.id));
  return posts.map((p) => ({ ...p, photos: map.get(p.id) ?? [] }));
});

export const getGalleryPost = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(160) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const posts = await sql<Omit<GalleryPost, "photos">>`
      select id, slug, title, place, blurb, category,
             cover_url as "coverUrl", created_at as "createdAt", views
      from gallery_posts
      where slug = ${data.slug}
      limit 1
    `;
    const post = posts[0];
    if (!post) return null;
    const map = await photosFor(sql, [post.id]);
    return { ...post, photos: map.get(post.id) ?? [] };
  });

export const createGalleryCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ label: z.string().min(2).max(40) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const base = data.label
      .toLowerCase()
      .replace(/[^\w\u0900-\u097F]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const slug = base || `album-${Date.now().toString(36)}`;
    const rows = await sql<GalleryCategory>`
      insert into gallery_categories (slug, label)
      values (${slug}, ${data.label.trim()})
      returning id, slug, label
    `;
    return rows[0];
  });

export const deleteGalleryCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from gallery_categories where id = ${data.id}`;
    return { ok: true };
  });

const postInput = z.object({
  title: z.string().min(3).max(160),
  place: z.string().min(2).max(80),
  blurb: z.string().max(400).optional(),
  category: z.string().min(2).max(40),
  coverUrl: z.string().max(500).optional(),
});

export const createGalleryPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(postInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const cover = cleanImageUrl(data.coverUrl);
    const rows = await sql<{ id: number; slug: string }>`
      insert into gallery_posts (slug, title, place, blurb, category, cover_url)
      values (
        ${slugify(data.title)},
        ${data.title.trim()},
        ${data.place.trim()},
        ${data.blurb?.trim() ?? ""},
        ${data.category},
        ${cover}
      )
      returning id, slug
    `;
    return rows[0];
  });

export const updateGalleryPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(postInput.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const cover = cleanImageUrl(data.coverUrl);
    await sql`
      update gallery_posts
      set title = ${data.title.trim()},
          place = ${data.place.trim()},
          blurb = ${data.blurb?.trim() ?? ""},
          category = ${data.category},
          cover_url = ${cover}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteGalleryPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from gallery_photos where post_id = ${data.id}`;
    await sql`delete from gallery_posts where id = ${data.id}`;
    return { ok: true };
  });

export const addGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      postId: z.number(),
      imageUrl: z.string().min(8).max(500),
      caption: z.string().max(160).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const imageUrl = cleanImageUrl(data.imageUrl);
    if (!imageUrl) throw new Error("तस्बिरको लिंक चाहिन्छ।");
    const rows = await sql<GalleryPhoto>`
      insert into gallery_photos (post_id, image_url, caption)
      values (${data.postId}, ${imageUrl}, ${data.caption?.trim() ?? ""})
      returning id, image_url as "imageUrl", caption
    `;
    return rows[0];
  });

export const deleteGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from gallery_photos where id = ${data.id}`;
    return { ok: true };
  });
