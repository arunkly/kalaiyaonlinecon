import { pickShareImage, shareProxyPath } from "@/lib/site-url";

function publicBrandOrigin() {
  return "https://www.kalaiyaonline.com";
}

export function crawlerOrigin(hostHeader?: string | null) {
  const host = String(hostHeader ?? "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  if (host === "kalaiyaonline.com" || host === "www.kalaiyaonline.com") {
    return `https://${host}`;
  }
  return publicBrandOrigin();
}

function esc(value: string) {
  return String(value)
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function stamp(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "1";
  const ms = Date.parse(raw);
  if (Number.isFinite(ms)) return String(Math.floor(ms / 1000));
  return raw.replace(/[^\w.-]/g, "").slice(0, 16) || "1";
}

function imageType(url: string) {
  if (/\.png(\?|#|$)/i.test(url)) return "image/png";
  if (/\.webp(\?|#|$)/i.test(url)) return "image/webp";
  if (/\.gif(\?|#|$)/i.test(url)) return "image/gif";
  return "image/jpeg";
}

function page(opts: { url: string; title: string; description: string; image: string }) {
  const title = esc(opts.title);
  const desc = esc(opts.description.slice(0, 180));
  const image = esc(opts.image);
  const url = esc(opts.url);
  const type = imageType(opts.image);
  return `<!doctype html>
<html lang="ne" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="canonical" href="${url}">
<link rel="image_src" href="${image}">
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ne_NP">
<meta property="og:site_name" content="KalaiyaOnline">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:url" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="${type}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
</head>
<body>
<img src="${image}" alt="${title}" width="1200" height="630">
<a href="${url}">${title}</a>
</body>
</html>`;
}

export function parseSharePath(pathname: string) {
  const match = String(pathname || "").match(/^\/(article|gallery|directory)\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return { kind: match[1] as "article" | "gallery" | "directory", id: decodeURIComponent(match[2]) };
  } catch {
    return { kind: match[1] as "article" | "gallery" | "directory", id: match[2] };
  }
}

export function isShareBot(ua: string) {
  return /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|Pinterest|vkShare|Googlebot-Image|meta-externalagent|meta-externalfetcher|facebookcatalog/i.test(
    ua || "",
  );
}

export async function renderShareCrawlerHtml(
  kind: "article" | "gallery" | "directory",
  id: string,
  hostHeader?: string | null,
) {
  const origin = crawlerOrigin(hostHeader);
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  if (kind === "article") {
    const rows = await sql<{
      title: string;
      excerpt: string;
      body: string;
      slug: string;
      imageUrl: string;
      updatedAt: string;
    }>`
      select title, excerpt, body, slug, image_url as "imageUrl",
             created_at as "updatedAt"
      from desk_stories
      where slug = ${id} and published = true
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const slug = row.slug || id;
    const title = cleanText(row.title, "KalaiyaOnline");
    return page({
      url: `${origin}/article/${encodeURIComponent(slug)}`,
      title,
      description: cleanText(row.excerpt || row.body, title),
      image: pickShareImage(row.imageUrl, shareProxyPath("article", slug, stamp(row.updatedAt)), origin),
    });
  }
  if (kind === "gallery") {
    const rows = await sql<{ title: string; place: string; slug: string; cover: string; photo: string }>`
      select p.title, p.place, p.slug, p.cover_url as cover, (
        select image_url from gallery_photos where post_id = p.id order by id asc limit 1
      ) as photo
      from gallery_posts p
      where p.slug = ${id}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const title = cleanText(row.title, "KalaiyaOnline");
    const slug = row.slug || id;
    return page({
      url: `${origin}/gallery/${encodeURIComponent(slug)}`,
      title,
      description: cleanText(row.place, title),
      image: pickShareImage(row.cover || row.photo, shareProxyPath("gallery", slug), origin),
    });
  }
  const num = Number(id);
  if (!Number.isFinite(num)) return null;
  const rows = await sql<{ name: string; place: string; id: number; imageUrl: string }>`
    select id, name, place, image_url as "imageUrl" from dir_entries where id = ${num} limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  const title = cleanText(row.name, "KalaiyaOnline");
  return page({
    url: `${origin}/directory/${row.id}`,
    title,
    description: cleanText(row.place, title),
    image: pickShareImage(row.imageUrl, shareProxyPath("directory", String(row.id)), origin),
  });
}

export async function handleShareCrawlerRequest(opts: {
  pathname: string;
  userAgent: string;
  host?: string | null;
}) {
  if (!isShareBot(opts.userAgent)) return null;
  const parsed = parseSharePath(opts.pathname);
  if (!parsed) return null;
  try {
    const html = await renderShareCrawlerHtml(parsed.kind, parsed.id, opts.host);
    if (!html) return null;
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60, must-revalidate",
        vary: "User-Agent",
      },
    });
  } catch {
    return null;
  }
}
