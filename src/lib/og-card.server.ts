import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { publicOrigin, rewriteShareImageSrc } from "@/lib/site-url";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function imageHeaders(type = "image/jpeg", length?: number) {
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": 'inline; filename="share.jpg"',
  };
  if (length && length > 0) headers["Content-Length"] = String(length);
  return headers;
}

function sniffImageType(buf: ArrayBuffer) {
  const b = new Uint8Array(buf.slice(0, 16));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp";
  }
  return "";
}

function stripImageExt(value: string) {
  return String(value || "").replace(/\.(jpe?g|png|webp|gif|avif)$/i, "");
}

async function fallbackJpeg() {
  const files = [
    join(process.cwd(), "public", "og.jpg"),
    join(process.cwd(), "og.jpg"),
    "/workspace/public/og.jpg",
  ];
  for (const file of files) {
    try {
      const buf = await readFile(file);
      if (buf.byteLength > 80) {
        return new Response(buf, { headers: imageHeaders("image/jpeg", buf.byteLength) });
      }
    } catch {
      /* try next */
    }
  }
  try {
    const res = await fetch(`${publicOrigin()}/og.jpg`);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 80 && sniffImageType(buf)) {
        return new Response(buf, { headers: imageHeaders("image/jpeg", buf.byteLength) });
      }
    }
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 404 });
}

function candidateUrls(src: string) {
  const rewritten = rewriteShareImageSrc(src);
  const urls = [rewritten, src.startsWith("//") ? `https:${src}` : src]
    .map((u) => u.trim())
    .filter((u, i, all) => u && /^https?:\/\//i.test(u) && all.indexOf(u) === i);
  const extras: string[] = [];
  for (const url of urls) {
    if (/\.webp(\?|#|$)/i.test(url)) extras.push(url.replace(/\.webp/i, ".jpg"));
    if (/\.avif(\?|#|$)/i.test(url)) extras.push(url.replace(/\.avif/i, ".jpg"));
  }
  return [...urls, ...extras].filter((u) => !/\/share-image\//i.test(u) && !/\/api\/og\//i.test(u));
}

async function fetchBinary(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const httpsUrl = url.replace(/^http:\/\//i, "https://");
    const res = await fetch(httpsUrl, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/gif,image/*;q=0.8,*/*;q=0.5",
        "User-Agent": BROWSER_UA,
      },
    });
    if (!res.ok) return null;
    const headerType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (headerType.startsWith("text/html") || headerType.includes("svg")) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 400 || buf.byteLength > 8_000_000) return null;
    const sniffed = sniffImageType(buf);
    if (!sniffed) return null;
    return { buf, type: sniffed };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function proxyRemoteImage(src: string | undefined) {
  for (const url of candidateUrls(String(src || ""))) {
    const got = await fetchBinary(url);
    if (got) {
      return new Response(got.buf, { headers: imageHeaders(got.type, got.buf.byteLength) });
    }
  }
  return fallbackJpeg();
}

export function parseShareImagePath(pathname: string) {
  let path = String(pathname || "").split("?")[0] || "";
  try {
    path = decodeURIComponent(path);
  } catch {
    /* keep raw */
  }
  const match = path.match(/^\/(?:share-image|api\/og)\/(article|gallery|directory)\/([^/]+?)\/?$/i);
  if (!match) return null;
  const kind = match[1].toLowerCase() as "article" | "gallery" | "directory";
  const id = stripImageExt(match[2]);
  if (!id) return null;
  return { kind, id };
}

export async function handleShareImageRequest(pathname: string) {
  const parsed = parseShareImagePath(pathname);
  if (!parsed) return null;
  if (parsed.kind === "article") return proxyArticleImage(parsed.id);
  if (parsed.kind === "gallery") return proxyGalleryImage(parsed.id);
  return proxyDirectoryImage(Number(parsed.id) || 0);
}

export async function proxyArticleImage(slug: string) {
  const key = stripImageExt(decodeSafe(slug));
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ imageUrl: string }>`
      select image_url as "imageUrl" from desk_stories
      where slug = ${key} and published = true
      limit 1
    `;
    return proxyRemoteImage(rows[0]?.imageUrl);
  } catch {
    return fallbackJpeg();
  }
}

export async function proxyGalleryImage(slug: string) {
  const key = stripImageExt(decodeSafe(slug));
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ cover: string; photo: string }>`
      select p.cover_url as cover, (
        select image_url from gallery_photos where post_id = p.id order by id asc limit 1
      ) as photo
      from gallery_posts p
      where p.slug = ${key}
      limit 1
    `;
    return proxyRemoteImage(rows[0]?.cover || rows[0]?.photo);
  } catch {
    return fallbackJpeg();
  }
}

export async function proxyDirectoryImage(id: number) {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ imageUrl: string }>`
      select image_url as "imageUrl" from dir_entries where id = ${id} limit 1
    `;
    return proxyRemoteImage(rows[0]?.imageUrl);
  } catch {
    return fallbackJpeg();
  }
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}
