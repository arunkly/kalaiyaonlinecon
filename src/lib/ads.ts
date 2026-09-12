import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export const AD_SLOTS = [
  { id: "header", label: "हेडर" },
  { id: "home-top", label: "गृह माथि" },
  { id: "home-sidebar", label: "गृह साइडबार" },
  { id: "article-top", label: "समाचार माथि" },
  { id: "article-bottom", label: "समाचार तल" },
  { id: "gallery", label: "ग्यालरी" },
  { id: "directory", label: "डाइरेक्ट्री" },
  { id: "blood", label: "रक्तदाता" },
  { id: "footer", label: "फुटर" },
  { id: "popup", label: "पपअप" },
] as const;

export const POPUP_FREQ = [
  { id: "always", label: "हरेक पेजमा" },
  { id: "session", label: "एक सत्रमा एक पटक" },
  { id: "hour", label: "घण्टामा एक पटक" },
  { id: "day", label: "दिनमा एक पटक" },
  { id: "3day", label: "३ दिनमा एक पटक" },
  { id: "week", label: "हप्तामा एक पटक" },
  { id: "once", label: "एक पटक मात्र" },
] as const;

export type AdKind = "photo" | "text" | "html";
export type PopupFreq = (typeof POPUP_FREQ)[number]["id"];
export type AdItem = {
  id: number;
  slot: string;
  kind: AdKind;
  title: string;
  body: string;
  imageUrl: string;
  html: string;
  href: string;
  active: boolean;
  freq: PopupFreq;
  delaySec: number;
};

async function assertAdmin(userId: string) {
  await assertCap(userId, "settings");
}

async function ensureAds() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`alter table ads add column if not exists freq text not null default 'session'`;
  await sql`alter table ads add column if not exists delay_sec integer not null default 2`;
  return sql;
}

export const listAds = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await ensureAds();
  return sql<AdItem>`
    select id, slot, kind, title, body,
           image_url as "imageUrl", html, href, active,
           coalesce(freq, 'session') as freq,
           coalesce(delay_sec, 2) as "delaySec"
    from ads
    order by id desc
  `;
});

export const listAdsBySlot = createServerFn({ method: "GET" })
  .validator(z.object({ slot: z.string().min(2).max(40) }))
  .handler(async ({ data }) => {
    const sql = await ensureAds();
    return sql<AdItem>`
      select id, slot, kind, title, body,
             image_url as "imageUrl", html, href, active,
             coalesce(freq, 'session') as freq,
             coalesce(delay_sec, 2) as "delaySec"
      from ads
      where slot = ${data.slot} and active = true
      order by id desc
    `;
  });

const adInput = z.object({
  slot: z.string().min(2).max(40),
  kind: z.enum(["photo", "text", "html"]),
  title: z.string().max(120).optional(),
  body: z.string().max(400).optional(),
  imageUrl: z.string().max(500).optional(),
  html: z.string().max(4000).optional(),
  href: z.string().max(500).optional(),
  active: z.boolean().optional(),
  freq: z.enum(["always", "session", "hour", "day", "3day", "week", "once"]).optional(),
  delaySec: z.number().int().min(0).max(60).optional(),
});

export const createAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(adInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await ensureAds();
    const freq = data.slot === "popup" ? data.freq || "session" : "session";
    const delay = data.slot === "popup" ? data.delaySec ?? 2 : 0;
    await sql`
      insert into ads (slot, kind, title, body, image_url, html, href, active, freq, delay_sec)
      values (
        ${data.slot},
        ${data.kind},
        ${data.title?.trim() ?? ""},
        ${data.body?.trim() ?? ""},
        ${data.imageUrl?.trim() ?? ""},
        ${data.html?.trim() ?? ""},
        ${data.href?.trim() ?? ""},
        ${data.active ?? true},
        ${freq},
        ${delay}
      )
    `;
    return { ok: true };
  });

export const deleteAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sql = await ensureAds();
    await sql`delete from ads where id = ${data.id}`;
    return { ok: true };
  });
