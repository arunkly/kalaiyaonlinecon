import { parseCategories } from "@/data/articles";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_EMAIL } from "@/lib/admin";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

const storyInput = z.object({
  title: z.string().trim().min(2, "शीर्षक लेख्नुहोस्।").max(180),
  excerpt: z.string().max(400).optional(),
  body: z.string().trim().min(8, "विवरण लेख्नुहोस्।").max(8000),
  category: z.string().min(1).max(40).optional(),
  categories: z.string().max(400).optional(),
  location: z.string().max(80).optional(),
  tags: z.string().max(160).optional(),
  imageUrl: z.string().max(2000).optional(),
});

export type DeskStory = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  categories?: string;
  location: string;
  tags: string;
  imageUrl?: string;
  galleryUrls?: string;
  published: boolean;
  createdAt: string;
  deletedAt?: string | null;
  userId?: string;
  authorName?: string;
  authorPhoto?: string;
};

export type DeskCategory = {
  id: number;
  slug: string;
  label: string;
};

function cleanImageUrl(raw?: string) {
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

function packCategories(primary?: string, extra?: string) {
  const list = parseCategories(primary, extra);
  return {
    category: list[0] || "local",
    categories: list.join(","),
  };
}

async function ensureDesk() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists desk_stories (
      id serial primary key,
      user_id text not null,
      slug text not null unique,
      title text not null,
      excerpt text not null,
      body text not null,
      category text not null default 'local',
      location text not null default 'कलैया, बारा',
      tags text not null default '',
      published boolean not null default true,
      created_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists desk_categories (
      id serial primary key,
      slug text not null unique,
      label text not null
    )
  `;
  await sql`alter table desk_stories add column if not exists image_url text not null default ''`;
  await sql`alter table desk_stories add column if not exists categories text not null default ''`;
  await sql`alter table desk_stories add column if not exists deleted_at timestamptz`;
  await sql`alter table desk_stories add column if not exists updated_at timestamptz not null default now()`;
  await sql`create index if not exists desk_stories_published_idx on desk_stories (published)`;
  for (const cat of [
    { slug: "news", label: "समाचार" },
    { slug: "international", label: "अन्तर्राष्ट्रिय" },
    { slug: "tech", label: "टेक" },
  ]) {
    await sql`
      insert into desk_categories (slug, label)
      values (${cat.slug}, ${cat.label})
      on conflict (slug) do nothing
    `;
  }
  return sql;
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "story"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function slugifyCat(label: string) {
  const base = label
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `cat-${Date.now().toString(36)}`;
}

async function assertAdmin(userId: string) {
  await assertCap(userId, "news");
}

export const ensureAdminReady = createServerFn({ method: "POST" }).handler(
  async () => {
    const { ensureAdminAccount } = await import("@/lib/ensure-admin.server");
    return ensureAdminAccount();
  },
);

function stampCreatedAt(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function withCreatedAt<T extends { createdAt?: unknown }>(row: T): T {
  return { ...row, createdAt: stampCreatedAt(row.createdAt) };
}

async function attachAuthors(sql: Awaited<ReturnType<typeof ensureDesk>>, rows: DeskStory[]) {
  const ids = [...new Set(rows.map((r) => r.userId).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return rows;
  try {
    const umap = new Map<string, { name: string | null; email: string | null; image: string | null }>();
    const pmap = new Map<string, { displayName: string; photoUrl: string }>();
    for (const id of ids) {
      const users = await sql<{ name: string | null; email: string | null; image?: string | null }>`
        select name, email from "user" where id = ${id} limit 1
      `;
      if (users[0]) umap.set(id, { ...users[0], image: null });
      try {
        const pics = await sql<{ image: string | null }>`
          select image from "user" where id = ${id} limit 1
        `;
        const current = umap.get(id);
        if (current) umap.set(id, { ...current, image: pics[0]?.image ?? null });
      } catch {
        /* image column may be missing */
      }
      const profiles = await sql<{ displayName: string; photoUrl: string }>`
        select display_name as "displayName", photo_url as "photoUrl"
        from member_profiles where user_id = ${id} limit 1
      `;
      if (profiles[0]) pmap.set(id, profiles[0]);
    }
    return rows.map((row) => {
      const user = umap.get(row.userId || "");
      const profile = pmap.get(row.userId || "");
      const authorName =
        profile?.displayName?.trim() ||
        user?.name?.trim() ||
        user?.email?.split("@")[0] ||
        row.authorName ||
        "";
      const authorPhoto = profile?.photoUrl?.trim() || user?.image?.trim() || row.authorPhoto || "";
      return { ...row, authorName, authorPhoto };
    });
  } catch {
    return rows;
  }
}

export const listPublishedStories = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await ensureDesk();
    try {
      const rows = await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, categories, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt", user_id as "userId"
        from desk_stories
        where published = true and deleted_at is null
        order by created_at desc
      `;
      return attachAuthors(sql, rows.map(withCreatedAt));
    } catch {
      const rows = await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, categories, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt", user_id as "userId"
        from desk_stories
        where published = true
        order by created_at desc
      `;
      return attachAuthors(sql, rows.map(withCreatedAt));
    }
  },
);

export const getPublishedStory = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const sql = await ensureDesk();
    try {
      const rows = await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, categories, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt", user_id as "userId"
        from desk_stories
        where slug = ${data.slug} and published = true and deleted_at is null
        limit 1
      `;
      const [story] = rows[0] ? await attachAuthors(sql, [withCreatedAt(rows[0])]) : [];
      return story ?? null;
    } catch {
      const rows = await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, categories, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt", user_id as "userId"
        from desk_stories
        where slug = ${data.slug} and published = true
        limit 1
      `;
      const [story] = rows[0] ? await attachAuthors(sql, [withCreatedAt(rows[0])]) : [];
      return story ?? null;
    }
  });

export const listCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await ensureDesk();
    return sql<DeskCategory>`
      select id, slug, label from desk_categories
      order by case when slug = 'headline' then 0 else 1 end, id asc
    `;
  },
);

export const listAdminStories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const sql = await ensureDesk();
    try {
      return await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, categories, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt"
        from desk_stories
        where deleted_at is null
        order by created_at desc
      `;
    } catch {
      return sql<DeskStory>`
        select id, slug, title, excerpt, body, category, categories, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt"
        from desk_stories
        order by created_at desc
      `;
    }
  });

export const listTrashStories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertCap(context.userId, "newsDelete");
    const sql = await ensureDesk();
    try {
      return await sql<DeskStory>`
        select id, slug, title, excerpt, body, category, categories, location, tags,
               image_url as "imageUrl", published, created_at as "createdAt",
               deleted_at as "deletedAt"
        from desk_stories
        where deleted_at is not null
        order by deleted_at desc
      `;
    } catch {
      return [];
    }
  });

export const createStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(storyInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (!context.userId) throw new Error("फेरि लगइन गर्नुहोस्।");
    const sql = await ensureDesk();
    const slug = slugify(data.title);
    const tags = data.tags?.trim() ?? "";
    const imageUrl = cleanImageUrl(data.imageUrl);
    const excerpt = (data.excerpt?.trim() || data.body.replace(/\s+/g, " ").trim()).slice(0, 400);
    const location = data.location?.trim() || "कलैया, बारा";
    const packed = packCategories(data.category, data.categories);
    try {
      const rows = await sql<DeskStory>`
        insert into desk_stories
          (user_id, slug, title, excerpt, body, category, categories, location, tags, image_url, published)
        values
          (${context.userId}, ${slug}, ${data.title}, ${excerpt}, ${data.body},
           ${packed.category}, ${packed.categories}, ${location}, ${tags}, ${imageUrl}, true)
        returning id, slug, title, excerpt, body, category, categories, location, tags,
                  image_url as "imageUrl", published, created_at as "createdAt"
      `;
      if (rows[0]) return rows[0];
    } catch {
      const rows = await sql<DeskStory>`
        insert into desk_stories
          (user_id, slug, title, excerpt, body, category, location, tags, image_url, published)
        values
          (${context.userId}, ${slug}, ${data.title}, ${excerpt}, ${data.body},
           ${packed.category}, ${location}, ${tags}, ${imageUrl}, true)
        returning id, slug, title, excerpt, body, category, location, tags,
                  image_url as "imageUrl", published, created_at as "createdAt"
      `;
      if (rows[0]) return rows[0];
    }
    throw new Error("समाचार सेभ भएन।");
  });

export const updateStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(storyInput.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await ensureDesk();
    const tags = data.tags?.trim() ?? "";
    const imageUrl = cleanImageUrl(data.imageUrl);
    const excerpt = (data.excerpt?.trim() || data.body.replace(/\s+/g, " ").trim()).slice(0, 400);
    const location = data.location?.trim() || "कलैया, बारा";
    const packed = packCategories(data.category, data.categories);
    try {
      const rows = await sql<DeskStory>`
        update desk_stories
        set title = ${data.title},
            excerpt = ${excerpt},
            body = ${data.body},
            category = ${packed.category},
            categories = ${packed.categories},
            location = ${location},
            tags = ${tags},
            image_url = ${imageUrl},
            updated_at = now()
        where id = ${data.id} and deleted_at is null
        returning id, slug, title, excerpt, body, category, categories, location, tags,
                  image_url as "imageUrl", published, created_at as "createdAt"
      `;
      return rows[0] ?? null;
    } catch {
      const rows = await sql<DeskStory>`
        update desk_stories
        set title = ${data.title},
            excerpt = ${excerpt},
            body = ${data.body},
            category = ${packed.category},
            location = ${location},
            tags = ${tags},
            image_url = ${imageUrl}
        where id = ${data.id}
        returning id, slug, title, excerpt, body, category, location, tags,
                  image_url as "imageUrl", published, created_at as "createdAt"
      `;
      return rows[0] ?? null;
    }
  });

export const trashStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "newsDelete");
    const sql = await ensureDesk();
    await sql`
      update desk_stories
      set deleted_at = now()
      where id = ${data.id} and deleted_at is null
    `;
    return { ok: true };
  });

export const restoreStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "newsDelete");
    const sql = await ensureDesk();
    await sql`
      update desk_stories
      set deleted_at = null
      where id = ${data.id} and deleted_at is not null
    `;
    return { ok: true };
  });

export const purgeStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "newsDelete");
    const sql = await ensureDesk();
    await sql`
      delete from desk_stories
      where id = ${data.id} and deleted_at is not null
    `;
    return { ok: true };
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ label: z.string().min(2).max(40) }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "newsDelete");
    const sql = await ensureDesk();
    const slug = slugifyCat(data.label);
    const rows = await sql<DeskCategory>`
      insert into desk_categories (slug, label)
      values (${slug}, ${data.label})
      returning id, slug, label
    `;
    return rows[0];
  });

export const updateCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number(),
      label: z.string().min(2).max(40),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "newsDelete");
    const sql = await ensureDesk();
    const existing = await sql<DeskCategory>`
      select id, slug, label from desk_categories where id = ${data.id}
    `;
    const current = existing[0];
    if (!current) throw new Error("Category not found");
    const nextSlug = slugifyCat(data.label);
    await sql`
      update desk_categories
      set label = ${data.label}, slug = ${nextSlug}
      where id = ${data.id}
    `;
    if (nextSlug !== current.slug) {
      await sql`
        update desk_stories
        set category = ${nextSlug}
        where category = ${current.slug}
      `;
      try {
        const rows = await sql<{ id: number; categories: string }>`
          select id, categories from desk_stories
          where categories like ${"%" + current.slug + "%"}
        `;
        for (const row of rows) {
          const next = parseCategories(undefined, row.categories)
            .map((slug) => (slug === current.slug ? nextSlug : slug))
            .join(",");
          await sql`update desk_stories set categories = ${next} where id = ${row.id}`;
        }
      } catch {
        /* older schema */
      }
    }
    return { id: data.id, slug: nextSlug, label: data.label };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "newsDelete");
    const sql = await ensureDesk();
    const existing = await sql<DeskCategory>`
      select id, slug, label from desk_categories where id = ${data.id}
    `;
    const current = existing[0];
    if (!current) throw new Error("Category not found");
    const live = await sql<{ count: string }>`
      select count(*)::text as count
      from desk_stories
      where category = ${current.slug} and deleted_at is null
    `;
    if (Number(live[0]?.count ?? 0) > 0) {
      throw new Error("यो विभागमा समाचार छन्। पहिले सार्नुहोस् वा ट्र्यासमा पठाउनुहोस्।");
    }
    await sql`delete from desk_categories where id = ${data.id}`;
    return { ok: true };
  });

export { ADMIN_EMAIL };
