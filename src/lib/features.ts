import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export const FEATURE_CATALOG = [
  { key: "market", label: "सेयर बजार", hint: "टिकर र सेयर पेज" },
  { key: "weather", label: "मौसम", hint: "हेडर मौसम बार" },
  { key: "newsTicker", label: "समाचार टिकर", hint: "मौसममुनि ताजा समाचार स्क्रोल" },
  { key: "gallery", label: "ग्यालरी", hint: "फोटो ग्यालरी" },
  { key: "directory", label: "डाइरेक्ट्री", hint: "स्थानीय सूची" },
  { key: "blood", label: "रक्तदाता", hint: "रक्तदाता पोर्टल" },
  { key: "chat", label: "च्याट", hint: "सदस्य च्याट" },
  { key: "dateConverter", label: "मिति कन्भर्टर", hint: "ई.सं. ↔ वि.सं." },
  { key: "preeti", label: "प्रीति कन्भर्टर", hint: "प्रीति ↔ युनिकोड" },
  { key: "patro", label: "पात्रो", hint: "नेपाली पात्रो" },
  { key: "privacy", label: "गोपनीयता नीति", hint: "गोपनीयता पेज" },
  { key: "members", label: "दर्ता सदस्य", hint: "सदस्य सूची" },
  { key: "about", label: "हाम्रोबारे", hint: "बारेमा पेज" },
  { key: "election", label: "निर्वाचन अपडेट", hint: "बारा प्रतिनिधिसभा र स्थानीय निकाय" },
  { key: "epaper", label: "ई-पेपर", hint: "मितिअनुसार PDF ई-पेपर" },
] as const;

export type FeatureKey = (typeof FEATURE_CATALOG)[number]["key"];
export type FeatureFlags = Record<FeatureKey, boolean>;

export const DEFAULT_FEATURES: FeatureFlags = {
  market: true,
  weather: true,
  newsTicker: true,
  gallery: true,
  directory: true,
  blood: true,
  chat: true,
  dateConverter: true,
  preeti: true,
  patro: true,
  privacy: true,
  members: true,
  about: true,
  election: true,
  epaper: true,
};

export const FEATURE_PATHS: { prefix: string; key: FeatureKey }[] = [
  { prefix: "/gallery", key: "gallery" },
  { prefix: "/directory", key: "directory" },
  { prefix: "/blood", key: "blood" },
  { prefix: "/chat", key: "chat" },
  { prefix: "/market", key: "market" },
  { prefix: "/patro", key: "patro" },
  { prefix: "/date-converter", key: "dateConverter" },
  { prefix: "/preeti", key: "preeti" },
  { prefix: "/privacy", key: "privacy" },
  { prefix: "/members", key: "members" },
  { prefix: "/member", key: "members" },
  { prefix: "/about", key: "about" },
  { prefix: "/election", key: "election" },
  { prefix: "/epaper", key: "epaper" },
];

export function featureForPath(pathname: string): FeatureKey | null {
  const hit = FEATURE_PATHS.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`));
  return hit?.key ?? null;
}

export function normalizeFeatures(raw: unknown): FeatureFlags {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const next = { ...DEFAULT_FEATURES };
  for (const item of FEATURE_CATALOG) {
    if (typeof src[item.key] === "boolean") next[item.key] = src[item.key] as boolean;
  }
  return next;
}

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists app_features (
      id integer primary key,
      flags text not null default '{}'
    )
  `;
  return sql;
}

export async function readFeatureFlags(): Promise<FeatureFlags> {
  try {
    const sql = await ensureTable();
    const rows = await sql<{ flags: string }>`select flags from app_features where id = 1 limit 1`;
    try {
      return normalizeFeatures(rows[0]?.flags ? JSON.parse(rows[0].flags) : {});
    } catch {
      return DEFAULT_FEATURES;
    }
  } catch {
    return DEFAULT_FEATURES;
  }
}

export const getFeatureFlags = createServerFn({ method: "GET" }).handler(async () => readFeatureFlags());

export const saveFeatureFlags = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ flags: z.any() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "settings");
    const flags = normalizeFeatures(data.flags);
    const sql = await ensureTable();
    const json = JSON.stringify(flags);
    await sql`
      insert into app_features (id, flags) values (1, ${json})
      on conflict (id) do update set flags = excluded.flags
    `;
    return { ok: true as const, flags };
  });
