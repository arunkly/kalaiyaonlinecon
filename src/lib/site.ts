import { DEFAULT_BOTTOM_BAR, DEFAULT_FOOTER_MENU, normalizeChromeKeys, type ChromeKey } from "@/lib/chrome-nav";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type SiteIdentity = {
  name: string;
  nameNp: string;
  tagline: string;
  description: string;
  searchHint: string;
  bottomBar: ChromeKey[];
  footerMenu: ChromeKey[];
};

export const DEFAULT_SITE: SiteIdentity = {
  name: "KalaiyaOnline",
  nameNp: "कलैयाअनलाइन",
  tagline: "कलैया, बारा र मधेशको स्थानीय समाचार",
  description:
    "कलैयाअनलाइन — कलैया, बारा, पर्सा र मधेशका स्थानीय समाचार, ग्यालरी, डाइरेक्ट्री, रक्तदाता र सेयर बजार।",
  searchHint: "समाचार खोज्नुहोस्",
  bottomBar: DEFAULT_BOTTOM_BAR,
  footerMenu: DEFAULT_FOOTER_MENU,
};

function text(value: unknown, fallback: string) {
  const v = value == null ? "" : String(value).trim();
  return v || fallback;
}

function parseChrome(raw: unknown): { bottomBar: ChromeKey[]; footerMenu: ChromeKey[] } {
  let parsed: unknown = raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }
  const row = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  return {
    bottomBar: normalizeChromeKeys(row.bottomBar, DEFAULT_BOTTOM_BAR),
    footerMenu: normalizeChromeKeys(row.footerMenu, DEFAULT_FOOTER_MENU),
  };
}

function normalize(row: Partial<Omit<SiteIdentity, "bottomBar" | "footerMenu">> & { chrome?: unknown; bottomBar?: string[]; footerMenu?: string[] } | null | undefined): SiteIdentity {
  const chrome = parseChrome(row && "chrome" in (row as object) ? (row as { chrome?: unknown }).chrome : { bottomBar: row?.bottomBar, footerMenu: row?.footerMenu });
  return {
    name: text(row?.name, DEFAULT_SITE.name),
    nameNp: text(row?.nameNp, DEFAULT_SITE.nameNp),
    tagline: text(row?.tagline, DEFAULT_SITE.tagline),
    description: text(row?.description, DEFAULT_SITE.description),
    searchHint: text(row?.searchHint, DEFAULT_SITE.searchHint),
    bottomBar: row?.bottomBar ? normalizeChromeKeys(row.bottomBar, DEFAULT_BOTTOM_BAR) : chrome.bottomBar,
    footerMenu: row?.footerMenu ? normalizeChromeKeys(row.footerMenu, DEFAULT_FOOTER_MENU) : chrome.footerMenu,
  };
}

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists site_identity (
      id integer primary key,
      name text not null default 'KalaiyaOnline',
      name_np text not null default 'कलैयाअनलाइन',
      tagline text not null default '',
      description text not null default '',
      search_hint text not null default ''
    )
  `;
  try {
    await sql`alter table site_identity add column if not exists chrome text not null default '{}'`;
  } catch {
    /* older pg */
  }
  return sql;
}

export async function readSiteIdentity(): Promise<SiteIdentity> {
  try {
    const sql = await ensureTable();
    const rows = await sql<{ name: string; nameNp: string; tagline: string; description: string; searchHint: string; chrome: string }>`
      select name, name_np as "nameNp", tagline, description, search_hint as "searchHint", coalesce(chrome, '{}') as chrome
      from site_identity where id = 1 limit 1
    `;
    return normalize(rows[0]);
  } catch {
    return DEFAULT_SITE;
  }
}

export const getSiteIdentity = createServerFn({ method: "GET" }).handler(async () => readSiteIdentity());

export const saveSiteIdentity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().min(2).max(80),
      nameNp: z.string().min(2).max(80),
      tagline: z.string().max(160).optional(),
      description: z.string().max(400).optional(),
      searchHint: z.string().max(80).optional(),
      bottomBar: z.array(z.string()).max(20).optional(),
      footerMenu: z.array(z.string()).max(20).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "settings");
    const next = normalize(data);
    const chrome = JSON.stringify({ bottomBar: next.bottomBar, footerMenu: next.footerMenu });
    const sql = await ensureTable();
    await sql`
      insert into site_identity (id, name, name_np, tagline, description, search_hint, chrome)
      values (1, ${next.name}, ${next.nameNp}, ${next.tagline}, ${next.description}, ${next.searchHint}, ${chrome})
      on conflict (id) do update set
        name = excluded.name,
        name_np = excluded.name_np,
        tagline = excluded.tagline,
        description = excluded.description,
        search_hint = excluded.search_hint,
        chrome = excluded.chrome
    `;
    try {
      await sql`
        update seo_settings set site_name = ${next.name} where id = 1
      `;
    } catch {
      /* seo table may be empty */
    }
    try {
      await sql`
        update about_page set org_name = ${next.name} where id = 1
      `;
    } catch {
      /* about table may be empty */
    }
    return next;
  });
