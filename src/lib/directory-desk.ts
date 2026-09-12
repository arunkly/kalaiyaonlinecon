import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";
import { DEFAULT_MAP, type MapSettings } from "@/lib/map-embed";

export type DirCategory = { id: number; slug: string; label: string };
export type DirItem = {
  id: number;
  name: string;
  category: string;
  place: string;
  note: string;
  phone: string;
  email: string;
  imageUrl: string;
  mapUrl: string;
  lat: number | null;
  lng: number | null;
  views?: number;
  createdAt?: string;
};

async function assertAdmin(userId: string) {
  await assertCap(userId, "directory");
}

function cleanHttpUrl(raw?: string) {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("लिंक सही छैन।");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("https वा http लिंक हुनुपर्छ।");
  }
  return parsed.toString();
}

function slugify(label: string) {
  const base = label
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || `dir-${Date.now().toString(36)}`;
}

export const getDirEntry = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<DirItem>`
      select id, name, category, place, note, phone, email,
             image_url as "imageUrl", map_url as "mapUrl",
             lat, lng, views, created_at as "createdAt"
      from dir_entries
      where id = ${data.id}
      limit 1
    `;
    return rows[0] ?? null;
  });

export const listDirCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  return sql<DirCategory>`select id, slug, label from dir_categories order by id asc`;
});

export const listDirEntries = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  return sql<DirItem>`
    select id, name, category, place, note, phone,
           image_url as "imageUrl", map_url as "mapUrl",
           lat, lng, views
    from dir_entries
    order by created_at desc
  `;
});

export const createDirCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ label: z.string().min(2).max(40) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<DirCategory>`
      insert into dir_categories (slug, label)
      values (${slugify(data.label)}, ${data.label.trim()})
      returning id, slug, label
    `;
    return rows[0];
  });

export const deleteDirCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from dir_categories where id = ${data.id}`;
    return { ok: true };
  });

const entryInput = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(40),
  place: z.string().min(2).max(80),
  note: z.string().max(400).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().max(80).optional(),
  imageUrl: z.string().max(500).optional(),
  mapUrl: z.string().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

async function geocodePlace(place: string) {
  const query = encodeURIComponent(`${place}, Nepal`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
      { headers: { "User-Agent": "KalaiyaOnline/1.0" } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat: string; lon: string }[];
    if (!rows[0]) return null;
    return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) };
  } catch {
    return null;
  }
}

export const createDirEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(entryInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const imageUrl = cleanHttpUrl(data.imageUrl);
    const mapUrl = cleanHttpUrl(data.mapUrl);
    const geo = await geocodePlace(data.place);
    const lat = data.lat ?? geo?.lat ?? null;
    const lng = data.lng ?? geo?.lng ?? null;
    const rows = await sql<{ id: number }>`
      insert into dir_entries (name, category, place, note, phone, email, image_url, map_url, lat, lng)
      values (
        ${data.name.trim()},
        ${data.category},
        ${data.place.trim()},
        ${data.note?.trim() ?? ""},
        ${data.phone?.trim() ?? ""},
        ${data.email?.trim() ?? ""},
        ${imageUrl},
        ${mapUrl},
        ${lat},
        ${lng}
      )
      returning id
    `;
    return rows[0];
  });

export const updateDirEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(entryInput.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const imageUrl = cleanHttpUrl(data.imageUrl);
    const mapUrl = cleanHttpUrl(data.mapUrl);
    const geo = await geocodePlace(data.place);
    const lat = data.lat ?? geo?.lat ?? null;
    const lng = data.lng ?? geo?.lng ?? null;
    await sql`
      update dir_entries
      set name = ${data.name.trim()},
          category = ${data.category},
          place = ${data.place.trim()},
          note = ${data.note?.trim() ?? ""},
          phone = ${data.phone?.trim() ?? ""},
          email = ${data.email?.trim() ?? ""},
          image_url = ${imageUrl},
          map_url = ${mapUrl},
          lat = ${lat},
          lng = ${lng}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteDirEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from dir_entries where id = ${data.id}`;
    return { ok: true };
  });

export const getMapSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<MapSettings>`
    select provider, lat, lng, zoom, height from map_settings where id = 1 limit 1
  `;
  const row = rows[0];
  if (!row) return DEFAULT_MAP;
  return {
    provider: row.provider === "google" ? "google" : "osm",
    lat: Number(row.lat),
    lng: Number(row.lng),
    zoom: Number(row.zoom),
    height: Number(row.height),
  } satisfies MapSettings;
});

export const saveMapSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      provider: z.enum(["osm", "google"]),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      zoom: z.number().min(8).max(18),
      height: z.number().min(160).max(480),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into map_settings (id, provider, lat, lng, zoom, height)
      values (1, ${data.provider}, ${data.lat}, ${data.lng}, ${data.zoom}, ${data.height})
      on conflict (id) do update set
        provider = excluded.provider,
        lat = excluded.lat,
        lng = excluded.lng,
        zoom = excluded.zoom,
        height = excluded.height
    `;
    return { ok: true };
  });
