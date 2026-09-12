import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { publicOrigin } from "@/lib/site-url";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function imageHeaders(type = "image/jpeg") {
  return {
    "Content-Type": type,
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  };
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
        return new Response(buf, { headers: imageHeaders("image/jpeg") });
      }
    } catch {
      /* try next */
    }
  }
  try {
    const res = await fetch(`${publicOrigin()}/og.jpg`);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return new Response(buf, { headers: imageHeaders("image/jpeg") });
    }
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 404 });
}

async function proxyRemoteImage(src: string | undefined) {
  let url = String(src || "").trim();
  if (url.startsWith("//")) url = `https:${url}`;
  else if (url.startsWith("/")) url = `${publicOrigin()}${url}`;
  if (!url || !/^https?:\/\//i.test(url)) return fallbackJpeg();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const httpsUrl = url.replace(/^http:\/\//i, "https://");
    const res = await fetch(httpsUrl, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": BROWSER_UA,
        Referer: publicOrigin() + "/",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return fallbackJpeg();
    const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/") || type.includes("svg")) return fallbackJpeg();
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 400) return fallbackJpeg();
    return new Response(buf, {
      headers: imageHeaders(type.startsWith("image/") ? type : "image/jpeg"),
    });
  } catch {
    return fallbackJpeg();
  }
}

export async function proxyArticleImage(slug: string) {
  let key = String(slug || "");
  try {
    key = decodeURIComponent(key);
  } catch {
    /* keep raw */
  }
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
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ cover: string; photo: string }>`
      select p.cover_url as cover, (
        select image_url from gallery_photos where post_id = p.id order by id asc limit 1
      ) as photo
      from gallery_posts p
      where p.slug = ${slug}
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
