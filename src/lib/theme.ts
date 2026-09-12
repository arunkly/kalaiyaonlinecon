import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export const THEME_FONTS = [
  { id: "mukta", label: "Mukta", href: "Mukta:wght@400;500;600;700;800", stack: '"Mukta", "Noto Sans Devanagari", ui-sans-serif, sans-serif' },
  { id: "noto", label: "Noto Sans Devanagari", href: "Noto+Sans+Devanagari:wght@400;500;600;700;800", stack: '"Noto Sans Devanagari", Mukta, sans-serif' },
  { id: "hind", label: "Hind", href: "Hind:wght@400;500;600;700", stack: '"Hind", "Noto Sans Devanagari", sans-serif' },
  { id: "tiro", label: "Tiro Devanagari", href: "Tiro+Devanagari+Sanskrit", stack: '"Tiro Devanagari Sanskrit", Mukta, serif' },
  { id: "kalam", label: "Kalam", href: "Kalam:wght@400;700", stack: '"Kalam", Mukta, cursive' },
] as const;

export type ThemeFontId = (typeof THEME_FONTS)[number]["id"];

export type ThemeSettings = {
  logoUrl: string;
  logoDarkUrl: string;
  primary: string;
  accent: string;
  font: ThemeFontId;
};

export const DEFAULT_THEME: ThemeSettings = {
  logoUrl: "/logo.jpg",
  logoDarkUrl: "/logo-dark.jpg",
  primary: "#14934E",
  accent: "#E87722",
  font: "mukta",
};

export const COLOR_PRESETS = [
  { id: "green", label: "हरियो", primary: "#14934E", accent: "#E87722" },
  { id: "crimson", label: "क्रिमसन", primary: "#9B1C2C", accent: "#C9A227" },
  { id: "blue", label: "निलो", primary: "#1D4ED8", accent: "#F59E0B" },
  { id: "red", label: "रातो", primary: "#B91C1C", accent: "#EA580C" },
] as const;

function text(value: unknown, fallback: string) {
  const v = value == null ? "" : String(value).trim();
  return v || fallback;
}

function hex(value: unknown, fallback: string) {
  const v = text(value, fallback);
  return /^#([0-9a-fA-F]{6})$/.test(v) ? v.toUpperCase() : fallback;
}

function fontId(value: unknown): ThemeFontId {
  const v = String(value || "");
  return THEME_FONTS.some((f) => f.id === v) ? (v as ThemeFontId) : "mukta";
}

export function normalizeTheme(row: Partial<ThemeSettings> | null | undefined): ThemeSettings {
  return {
    logoUrl: text(row?.logoUrl, DEFAULT_THEME.logoUrl),
    logoDarkUrl: text(row?.logoDarkUrl, DEFAULT_THEME.logoDarkUrl),
    primary: hex(row?.primary, DEFAULT_THEME.primary),
    accent: hex(row?.accent, DEFAULT_THEME.accent),
    font: fontId(row?.font),
  };
}

function mix(hexColor: string, ratio: number) {
  const n = hexColor.replace("#", "");
  const r = Math.round(parseInt(n.slice(0, 2), 16) * ratio);
  const g = Math.round(parseInt(n.slice(2, 4), 16) * ratio);
  const b = Math.round(parseInt(n.slice(4, 6), 16) * ratio);
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`;
}

export function fontHref(font: ThemeFontId) {
  const spec = THEME_FONTS.find((f) => f.id === font) ?? THEME_FONTS[0];
  return `https://fonts.googleapis.com/css2?family=${spec.href}&display=swap`;
}

export function fontStack(font: ThemeFontId) {
  return (THEME_FONTS.find((f) => f.id === font) ?? THEME_FONTS[0]).stack;
}

export function themeCssVars(theme: ThemeSettings) {
  const primary = theme.primary;
  const deep = mix(primary, 0.72);
  return {
    "--color-crimson": primary,
    "--color-crimson-deep": deep,
    "--color-mark": theme.accent,
    "--font-display": fontStack(theme.font),
    "--font-sans": fontStack(theme.font),
    "--theme-primary": primary,
    "--theme-accent": theme.accent,
  } as Record<string, string>;
}

async function ensureThemeTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists theme_settings (
      id integer primary key,
      logo_url text not null default '/logo.jpg',
      logo_dark_url text not null default '/logo-dark.jpg',
      primary_color text not null default '#14934E',
      accent_color text not null default '#E87722',
      font text not null default 'mukta'
    )
  `;
  return sql;
}

export async function readThemeSettings(): Promise<ThemeSettings> {
  try {
    const sql = await ensureThemeTable();
    const rows = await sql<Partial<ThemeSettings>>`
      select logo_url as "logoUrl", logo_dark_url as "logoDarkUrl",
             primary_color as "primary", accent_color as "accent", font
      from theme_settings where id = 1 limit 1
    `;
    return normalizeTheme(rows[0]);
  } catch {
    return DEFAULT_THEME;
  }
}

export const getThemeSettings = createServerFn({ method: "GET" }).handler(async () => readThemeSettings());

export const saveThemeSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      logoUrl: z.string().max(500).optional(),
      logoDarkUrl: z.string().max(500).optional(),
      primary: z.string().regex(/^#([0-9a-fA-F]{6})$/),
      accent: z.string().regex(/^#([0-9a-fA-F]{6})$/),
      font: z.enum(["mukta", "noto", "hind", "tiro", "kalam"]),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "settings");
    const next = normalizeTheme(data);
    const sql = await ensureThemeTable();
    await sql`
      insert into theme_settings (id, logo_url, logo_dark_url, primary_color, accent_color, font)
      values (1, ${next.logoUrl}, ${next.logoDarkUrl}, ${next.primary}, ${next.accent}, ${next.font})
      on conflict (id) do update set
        logo_url = excluded.logo_url,
        logo_dark_url = excluded.logo_dark_url,
        primary_color = excluded.primary_color,
        accent_color = excluded.accent_color,
        font = excluded.font
    `;
    return { ok: true as const, theme: next };
  });
