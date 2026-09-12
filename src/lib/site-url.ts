export function siteOrigin() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.APP_URL ||
    "https://www.kalaiyaonline.com"
  ).replace(/\/$/, "");
}

export function publicOrigin() {
  return "https://www.kalaiyaonline.com";
}

export function absoluteUrl(pathOrUrl: string | undefined, origin = publicOrigin()) {
  const value = pathOrUrl?.trim() ?? "";
  if (!value) return `${origin}/og.jpg`;
  if (value.startsWith("https://")) return value;
  if (value.startsWith("http://")) return `https://${value.slice("http://".length)}`;
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/og.jpg`;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i;
const IMAGE_HOST =
  /(?:fbcdn\.net|fbsbx\.com|googleusercontent\.com|ggpht\.com|twimg\.com|imgur\.com|imgbb\.com|i\.ibb\.co|cloudinary\.com|cloudfront\.net|unsplash\.com|lh[0-9]\.googleusercontent\.com|wp-content\/uploads|\/uploads\/|\/media\/|\/images\/)/i;

export function rewriteShareImageSrc(raw?: string | null) {
  let url = String(raw ?? "").trim();
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return "";
  if (url.startsWith("//")) url = `https:${url}`;
  if (url.startsWith("http://")) url = `https://${url.slice("http://".length)}`;
  const drive =
    url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i) ||
    url.match(/drive\.google\.com\/(?:open|uc)\?[^#]*[?&]?id=([^&#]+)/i);
  if (drive?.[1]) return `https://drive.google.com/uc?export=view&id=${drive[1]}`;
  return url;
}

export function isPublicImageUrl(raw?: string | null) {
  const url = rewriteShareImageSrc(raw);
  if (!/^https:\/\//i.test(url)) return false;
  if (/\s/.test(url)) return false;
  if (/\/share-image\//i.test(url) || /\/api\/og\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return false;
  } catch {
    return false;
  }
  if (IMAGE_EXT.test(url)) return true;
  if (IMAGE_HOST.test(url)) return true;
  if (/[?&](format|fm|type)=(jpe?g|png|webp|gif)/i.test(url)) return true;
  return false;
}

export function shareProxyPath(kind: "article" | "gallery" | "directory", id: string, version?: string | number) {
  const path = `/share-image/${kind}/${encodeURIComponent(String(id))}.jpg`;
  const stamp = String(version ?? "").replace(/[^\w.-]/g, "").slice(0, 24);
  return stamp ? `${path}?v=${stamp}` : path;
}

export function imageTypeFromUrl(url: string) {
  const match = String(url).match(/\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i);
  if (!match) return "";
  const ext = match[1].toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return "";
}

export function pickShareImage(
  imageUrl: string | undefined,
  imagePath: string | undefined,
  origin = publicOrigin(),
) {
  const direct = rewriteShareImageSrc(imageUrl);
  if (isPublicImageUrl(direct)) return direct;
  return absoluteUrl(imagePath, origin);
}

export function sharePageMeta(opts: {
  title: string;
  description?: string;
  path: string;
  imagePath?: string;
  imageUrl?: string;
  type?: "article" | "website";
}) {
  const origin = publicOrigin();
  const headline = opts.title.trim() || "KalaiyaOnline";
  const desc = String(opts.description || "कलैयाअनलाइन — कलैया, बारा र मधेशको स्थानीय समाचार।")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const url = `${origin}${opts.path.startsWith("/") ? opts.path : `/${opts.path}`}`;
  const image = pickShareImage(opts.imageUrl, opts.imagePath, origin);
  const imageType = imageTypeFromUrl(image) || "image/jpeg";
  return {
    title: `${headline} | KalaiyaOnline`,
    meta: [
      { title: `${headline} | KalaiyaOnline` },
      { name: "description", content: desc },
      { name: "robots", content: "index,follow" },
      { property: "og:type", content: opts.type || "article" },
      { property: "og:locale", content: "ne_NP" },
      { property: "og:site_name", content: "KalaiyaOnline" },
      { property: "og:title", content: headline },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:url", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:type", content: imageType },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: headline },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: headline },
      { name: "twitter:description", content: desc },
      { name: "twitter:image", content: image },
      { itemProp: "name", content: headline },
      { itemProp: "description", content: desc },
      { itemProp: "image", content: image },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "image_src", href: image },
    ],
  };
}
