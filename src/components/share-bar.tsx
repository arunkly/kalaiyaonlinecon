import { Check, Link2, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { publicOrigin } from "@/lib/site-url";

export function ShareBar({
  path,
  title,
}: {
  path?: string;
  slug?: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    const suffix = path?.startsWith("/") ? path : `/${path || ""}`;
    return `${publicOrigin()}${suffix}`;
  }, [path]);
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url, text: title });
        return;
      } catch {
        /* cancelled */
      }
    }
    void copy();
  }

  return (
    <div className="mt-8 text-center">
      <p className="text-[11px] font-bold tracking-[0.18em] text-muted">सेयर गर्नुहोस्</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-full bg-[#1877F2] px-2.5 text-[11px] font-semibold text-white"
        >
          f Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center rounded-full bg-[#111111] px-2.5 text-[11px] font-semibold text-white"
        >
          𝕏
        </a>
        <a
          href={`https://api.whatsapp.com/send?text=${text}%20${encoded}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center rounded-full bg-[#25D366] px-2.5 text-[11px] font-semibold text-white"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold",
            copied ? "bg-crimson text-paper" : "border border-line bg-paper text-ink",
          )}
        >
          {copied ? <Check className="size-3" /> : <Link2 className="size-3" />}
          {copied ? "कपी" : "लिंक"}
        </button>
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-mark px-2.5 text-[11px] font-semibold text-paper"
        >
          <Share2 className="size-3" />
          सेयर
        </button>
      </div>
    </div>
  );
}
