const ORIGIN = "https://www.kalaiyaonline.com";

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

function imageFor(kind: string, id: string, remote?: string) {
  const url = String(remote || "").trim();
  if (/^https:\/\//i.test(url)) return url;
  if (/^http:\/\//i.test(url)) return `https://${url.slice("http://".length)}`;
  if (kind === "article") return `${ORIGIN}/api/og/article/${encodeURIComponent(id)}`;
  if (kind === "gallery") return `${ORIGIN}/share-image/gallery/${encodeURIComponent(id)}`;
  if (kind === "directory") return `${ORIGIN}/share-image/directory/${encodeURIComponent(id)}`;
  return `${ORIGIN}/og.jpg`;
}

function page(opts: { url: string; title: string; description: string; image: string }) {
  const title = esc(opts.title);
  const desc = esc(opts.description.slice(0, 180));
  const image = esc(opts.image);
  const url = esc(opts.url);
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
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
</head>
<body>
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
  return /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|Pinterest|vkShare|Googlebot-Image/i.test(
    ua || "",
  );
}

export async function renderShareCrawlerHtml(kind: "article" | "gallery" | "directory", id: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  if (kind === "article") {
    const rows = await sql<{ title: string; excerpt: string; body: string; imageUrl: string; slug: string }>`
      select title, excerpt, body, image_url as "imageUrl", slug
      from desk_stories
      where slug = ${id} and published = true
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const slug = row.slug || id;
    const title = cleanText(row.title, "KalaiyaOnline");
    return page({
      url: `${ORIGIN}/article/${encodeURIComponent(slug)}`,
      title,
      description: cleanText(row.excerpt || row.body, title),
      image: imageFor("article", slug, row.imageUrl),
    });
  }
  if (kind === "gallery") {
    const rows = await sql<{ title: string; place: string; cover: string; slug: string }>`
      select title, place, cover_url as cover, slug from gallery_posts where slug = ${id} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const title = cleanText(row.title, "KalaiyaOnline");
    return page({
      url: `${ORIGIN}/gallery/${encodeURIComponent(row.slug || id)}`,
      title,
      description: cleanText(row.place, title),
      image: imageFor("gallery", row.slug || id, row.cover),
    });
  }
  const num = Number(id);
  if (!Number.isFinite(num)) return null;
  const rows = await sql<{ name: string; place: string; imageUrl: string; id: number }>`
    select id, name, place, image_url as "imageUrl" from dir_entries where id = ${num} limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  const title = cleanText(row.name, "KalaiyaOnline");
  return page({
    url: `${ORIGIN}/directory/${row.id}`,
    title,
    description: cleanText(row.place, title),
    image: imageFor("directory", String(row.id), row.imageUrl),
  });
}
