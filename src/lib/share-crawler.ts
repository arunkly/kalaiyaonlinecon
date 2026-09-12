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

function imageFor(origin: string, kind: string, id: string) {
  if (kind === "article") return `${origin}/share-image/article/${encodeURIComponent(id)}`;
  if (kind === "gallery") return `${origin}/share-image/gallery/${encodeURIComponent(id)}`;
  if (kind === "directory") return `${origin}/share-image/directory/${encodeURIComponent(id)}`;
  return `${origin}/og.jpg`;
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
    const rows = await sql<{ title: string; excerpt: string; body: string; slug: string }>`
      select title, excerpt, body, slug
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
      image: imageFor(origin, "article", slug),
    });
  }
  if (kind === "gallery") {
    const rows = await sql<{ title: string; place: string; slug: string }>`
      select title, place, slug from gallery_posts where slug = ${id} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const title = cleanText(row.title, "KalaiyaOnline");
    const slug = row.slug || id;
    return page({
      url: `${origin}/gallery/${encodeURIComponent(slug)}`,
      title,
      description: cleanText(row.place, title),
      image: imageFor(origin, "gallery", slug),
    });
  }
  const num = Number(id);
  if (!Number.isFinite(num)) return null;
  const rows = await sql<{ name: string; place: string; id: number }>`
    select id, name, place from dir_entries where id = ${num} limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  const title = cleanText(row.name, "KalaiyaOnline");
  return page({
    url: `${origin}/directory/${row.id}`,
    title,
    description: cleanText(row.place, title),
    image: imageFor(origin, "directory", String(row.id)),
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
        "cache-control": "public, max-age=120, must-revalidate",
        vary: "User-Agent",
      },
    });
  } catch {
    return null;
  }
}
