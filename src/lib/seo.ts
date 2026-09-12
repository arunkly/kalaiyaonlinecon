import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";
import { siteOrigin } from "@/lib/site-url";

export type SeoSettings = {
  siteName: string;
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalUrl: string;
  googleVerify: string;
  robots: string;
  twitter: string;
};

export const DEFAULT_SEO: SeoSettings = {
  siteName: "KalaiyaOnline",
  title: "KalaiyaOnline — कलैया, बारा र मधेशको समाचार",
  description:
    "कलैयाअनलाइन — कलैया, बारा, पर्सा र मधेशका स्थानीय समाचार, ग्यालरी, डाइरेक्ट्री, रक्तदाता र सेयर बजार।",
  keywords: "कलैया, बारा, मधेश, समाचार, KalaiyaOnline, Nepal news, Bara news",
  ogImage: "/og.jpg",
  canonicalUrl: "https://www.kalaiyaonline.com",
  googleVerify: "",
  robots: "index,follow",
  twitter: "",
};

function text(value: unknown, fallback = "") {
  if (value == null) return fallback;
  return String(value);
}

function normalize(row: Partial<SeoSettings> | null | undefined): SeoSettings {
  const canonical = text(row?.canonicalUrl, DEFAULT_SEO.canonicalUrl).replace(/\/$/, "") || DEFAULT_SEO.canonicalUrl;
  return {
    siteName: text(row?.siteName, DEFAULT_SEO.siteName) || DEFAULT_SEO.siteName,
    title: text(row?.title, DEFAULT_SEO.title) || DEFAULT_SEO.title,
    description: text(row?.description, DEFAULT_SEO.description) || DEFAULT_SEO.description,
    keywords: text(row?.keywords, DEFAULT_SEO.keywords),
    ogImage: text(row?.ogImage, DEFAULT_SEO.ogImage) || DEFAULT_SEO.ogImage,
    canonicalUrl: canonical,
    googleVerify: text(row?.googleVerify),
    robots: text(row?.robots, DEFAULT_SEO.robots) || DEFAULT_SEO.robots,
    twitter: text(row?.twitter).replace(/^@/, ""),
  };
}

async function ensureSeoTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists seo_settings (
      id integer primary key,
      site_name text not null default 'KalaiyaOnline',
      title text not null default '',
      description text not null default '',
      keywords text not null default '',
      og_image text not null default '/og.jpg',
      canonical_url text not null default 'https://www.kalaiyaonline.com',
      google_verify text not null default '',
      robots text not null default 'index,follow',
      twitter text not null default ''
    )
  `;
  return sql;
}

export async function readSeoSettings(): Promise<SeoSettings> {
  try {
    const sql = await ensureSeoTable();
    const rows = await sql<Partial<SeoSettings>>`
      select site_name as "siteName", title, description, keywords,
             og_image as "ogImage", canonical_url as "canonicalUrl",
             google_verify as "googleVerify", robots, twitter
      from seo_settings where id = 1 limit 1
    `;
    return normalize(rows[0]);
  } catch {
    return DEFAULT_SEO;
  }
}

export const getSeoSettings = createServerFn({ method: "GET" }).handler(async () => readSeoSettings());

export const saveSeoSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      siteName: z.string().min(2).max(80),
      title: z.string().min(4).max(120),
      description: z.string().min(8).max(320),
      keywords: z.string().max(400).optional(),
      ogImage: z.string().max(500).optional(),
      canonicalUrl: z.string().max(200).optional(),
      googleVerify: z.string().max(120).optional(),
      robots: z.string().max(80).optional(),
      twitter: z.string().max(40).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "settings");
    const next = normalize(data);
    const sql = await ensureSeoTable();
    await sql`
      insert into seo_settings (
        id, site_name, title, description, keywords, og_image, canonical_url, google_verify, robots, twitter
      )
      values (
        1,
        ${next.siteName},
        ${next.title},
        ${next.description},
        ${next.keywords},
        ${next.ogImage},
        ${next.canonicalUrl},
        ${next.googleVerify},
        ${next.robots},
        ${next.twitter}
      )
      on conflict (id) do update set
        site_name = excluded.site_name,
        title = excluded.title,
        description = excluded.description,
        keywords = excluded.keywords,
        og_image = excluded.og_image,
        canonical_url = excluded.canonical_url,
        google_verify = excluded.google_verify,
        robots = excluded.robots,
        twitter = excluded.twitter
    `;
    return { ok: true as const };
  });

export function seoImage(seo: SeoSettings, origin = siteOrigin()) {
  const value = seo.ogImage?.trim() || "/og.jpg";
  if (value.startsWith("http://") || value.startsWith("https://")) return value.replace(/^http:\/\//, "https://");
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function organizationJsonLd(seo: SeoSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: seo.siteName,
    url: seo.canonicalUrl,
    logo: `${seo.canonicalUrl}/logo.jpg`,
    description: seo.description,
    inLanguage: "ne",
    areaServed: ["Kalaiya", "Bara", "Madhesh", "Nepal"],
  };
}
