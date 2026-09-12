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

export function sharePageMeta(opts: {
  title: string;
  description?: string;
  path: string;
  imagePath?: string;
  type?: "article" | "website";
}) {
  const origin = publicOrigin();
  const headline = opts.title.trim() || "KalaiyaOnline";
  const desc = String(opts.description || "कलैया, बारा र मधेशको स्थानीय समाचार।")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const url = `${origin}${opts.path.startsWith("/") ? opts.path : `/${opts.path}`}`;
  const image = absoluteUrl(opts.imagePath, origin);
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
      { property: "og:image:type", content: "image/jpeg" },
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
