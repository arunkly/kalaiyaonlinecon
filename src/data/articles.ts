export type Category = string;

export type Article = {
  slug: string;
  title: string;
  titleNp?: string;
  excerpt: string;
  body: string[];
  category: Category;
  categories?: string[];
  tags: string[];
  author: string;
  authorId?: string;
  authorPhoto?: string;
  date: string;
  location: string;
  imageUrl?: string;
  gallery?: string[];
  featured?: boolean;
  breaking?: boolean;
  sourceUrl: string;
  lang: "en" | "np";
};

export const HEADLINE_SLUG = "headline";

export const CATEGORIES: { slug: Category; label: string; labelNp: string }[] = [
  { slug: "headline", label: "Headline", labelNp: "हेडलाइन" },
  { slug: "local", label: "Local", labelNp: "स्थानीय" },
  { slug: "news", label: "National", labelNp: "राष्ट्रिय" },
  { slug: "international", label: "International", labelNp: "अन्तर्राष्ट्रिय" },
  { slug: "politics", label: "Politics", labelNp: "राजनीति" },
  { slug: "crime", label: "Crime", labelNp: "अपराध" },
  { slug: "business", label: "Business", labelNp: "व्यापार" },
  { slug: "health", label: "Health", labelNp: "स्वास्थ्य" },
  { slug: "sports", label: "Sports", labelNp: "खेलकुद" },
  { slug: "tech", label: "Tech", labelNp: "टेक" },
  { slug: "community", label: "Community", labelNp: "समुदाय" },
  { slug: "development", label: "Development", labelNp: "विकास" },
];

export const articles: Article[] = [];

export function byCategory(slug: Category) {
  return articles.filter((a) => a.category === slug);
}

export function parseCategories(primary?: string | null, extra?: string | string[] | null): string[] {
  const extraText = Array.isArray(extra) ? extra.join(",") : extra || "";
  const out: string[] = [];
  for (const part of `${primary || ""},${extraText}`.split(/[,|]/)) {
    const value = part.trim();
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
}

export function articleCategories(article: { category?: string; categories?: string[] }): string[] {
  return parseCategories(article.category, article.categories);
}

export function articleHasCategory(
  article: { category?: string; categories?: string[] },
  slug: string,
  label?: string,
) {
  const all = articleCategories(article).map((c) => c.toLowerCase());
  if (all.includes(slug.toLowerCase())) return true;
  if (label && all.includes(label.toLowerCase())) return true;
  return false;
}

export function isHeadline(category: string) {
  return category === HEADLINE_SLUG || category === "हेडलाइन";
}

export function isHeadlineArticle(article: { category?: string; categories?: string[] }) {
  return articleCategories(article).some(isHeadline);
}

export function byLatest<T extends { date?: string }>(a: T, b: T) {
  return String(b.date || "").localeCompare(String(a.date || ""));
}

export function searchArticles(q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  return articles.filter((a) =>
    [a.title, a.titleNp ?? "", a.excerpt, a.tags.join(" "), a.location, a.category]
      .join(" ")
      .toLowerCase()
      .includes(n),
  );
}

export function relatedArticles(article: Article, limit = 3) {
  return articles
    .filter(
      (a) =>
        a.slug !== article.slug &&
        (a.category === article.category ||
          a.tags.some((t) => article.tags.includes(t))),
    )
    .slice(0, limit);
}

const NP_MONTHS = [
  "जनवरी",
  "फेब्रुअरी",
  "मार्च",
  "अप्रिल",
  "मे",
  "जुन",
  "जुलाई",
  "अगस्ट",
  "सेप्टेम्बर",
  "अक्टोबर",
  "नोभेम्बर",
  "डिसेम्बर",
];

const NP_DIGITS = "०१२३४५६७८९";

export function toNpDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => NP_DIGITS[Number(d)] ?? d);
}

export function formatDate(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const raw = iso instanceof Date ? iso.toISOString() : String(iso);
  const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
  const month = NP_MONTHS[(m ?? 1) - 1] ?? "";
  return `${toNpDigits(d ?? 1)} ${month} ${toNpDigits(y ?? 2026)}`;
}

export function timeAgoNp(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const t = iso instanceof Date ? iso.getTime() : new Date(iso).getTime();
  if (!Number.isFinite(t)) return formatDate(iso);
  const min = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (min < 1) return "अहिले";
  if (min < 60) return `${toNpDigits(min)} मिनेट अगाडि`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${toNpDigits(h)} घण्टा अगाडि`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${toNpDigits(d)} दिन अगाडि`;
  return formatDate(iso);
}

export function displayTitle(article: { title: string; titleNp?: string }) {
  return article.titleNp ?? article.title;
}
