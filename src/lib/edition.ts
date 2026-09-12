import { useEffect, useMemo, useState } from "react";
import { articles, byLatest, parseCategories, type Article, type Category } from "@/data/articles";
import {
  getPublishedStory,
  listPublishedStories,
  type DeskStory,
} from "@/lib/desk";

const GALLERY_MARK = "<!--KO-GALLERY-->";

export function splitGalleryBody(body: string) {
  const text = String(body || "");
  const idx = text.indexOf(GALLERY_MARK);
  if (idx < 0) return { body: text.trim(), urls: [] as string[] };
  return { body: text.slice(0, idx).trim(), urls: [] as string[] };
}

export function parseGalleryField(raw?: string | string[] | null) {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string" && Boolean(v.trim()));
  }
  if (!raw) return [] as string[];
  if (typeof raw !== "string") return [] as string[];
  const trimmed = raw.trim();
  if (!trimmed) return [] as string[];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string" && Boolean(v.trim()));
    }
  } catch {
    /* newline / comma list */
  }
  return trimmed
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter((part) => /^https?:\/\//i.test(part));
}

export function storyTimestamp(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = value < 1e12 ? new Date(value * 1000) : new Date(value);
    return Number.isFinite(d.getTime()) ? d.toISOString() : "";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const parsed = new Date(trimmed);
    if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
    return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : "";
  }
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (typeof rec.toISOString === "function") {
      try {
        const iso = (rec as { toISOString: () => string }).toISOString();
        if (iso) return iso;
      } catch {
        /* ignore */
      }
    }
    return storyTimestamp(rec.createdAt ?? rec.created_at ?? rec.date);
  }
  return "";
}

export function dateFromSlug(slug: string): string {
  const parts = String(slug || "").split("-").filter(Boolean);
  if (parts.length < 2) return "";
  const token = parts[parts.length - 2];
  if (!token || token.length < 6 || token.length > 12) return "";
  const ms = Number.parseInt(token, 36);
  const min = Date.UTC(2020, 0, 1);
  const max = Date.now() + 86_400_000;
  if (!Number.isFinite(ms) || ms < min || ms > max) return "";
  return new Date(ms).toISOString();
}

export function storyPublishIso(story: { slug?: string; createdAt?: unknown }): string {
  const created = storyTimestamp(story.createdAt);
  const fromSlug = dateFromSlug(String(story.slug || ""));
  const dates = [created, fromSlug].filter(Boolean).sort();
  return dates[0] || "";
}

export function deskToArticle(s: DeskStory): Article {
  const date = storyPublishIso(s);
  const rawBody = typeof s.body === "string" ? s.body : String(s.body ?? "");
  const split = splitGalleryBody(rawBody);
  const tagText = typeof s.tags === "string" ? s.tags : "";
  return {
    slug: String(s.slug || ""),
    title: String(s.title || ""),
    excerpt: String(s.excerpt ?? ""),
    body: split.body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
    category: (s.category || "local") as Category,
    categories: parseCategories(s.category, s.categories),
    tags: tagText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    author: s.authorName?.trim() || "कलैयाअनलाइन",
    authorId: s.userId,
    authorPhoto: s.authorPhoto || undefined,
    date,
    location: String(s.location || "कलैया"),
    imageUrl: s.imageUrl || undefined,
    gallery: [],
    featured: true,
    sourceUrl: `https://kalaiyaonline.com/${s.slug}/`,
    lang: "np",
  };
}

export function useEdition() {
  const [extra, setExtra] = useState<Article[]>([]);

  useEffect(() => {
    void listPublishedStories()
      .then((rows) =>
        setExtra(
          (rows ?? []).flatMap((row) => {
            try {
              return [deskToArticle(row)];
            } catch {
              return [];
            }
          }),
        ),
      )
      .catch(() => setExtra([]));
  }, []);

  return useMemo(() => {
    const seen = new Set(extra.map((a) => a.slug));
    return [...extra, ...articles.filter((a) => !seen.has(a.slug))].sort(byLatest);
  }, [extra]);
}

export function useEditionArticle(slug: string) {
  const edition = useEdition();
  const fromList = edition.find((a) => a.slug === slug);
  const [fetched, setFetched] = useState<Article | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFetched(null);
    setFailed(false);
    if (!slug) return;
    void getPublishedStory({ data: { slug } })
      .then((row) => {
        setFetched(row ? deskToArticle(row) : null);
        setFailed(!row);
      })
      .catch(() => {
        setFetched(null);
        setFailed(true);
      });
  }, [slug]);

  return {
    article: fetched ?? fromList,
    missing: failed && !fromList,
  };
}