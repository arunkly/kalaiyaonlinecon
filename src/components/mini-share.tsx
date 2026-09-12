import type { MouseEvent } from "react";

export function MiniShare({ path, title }: { path: string; title: string }) {
  const url =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : `https://kalaiyaonline.com${path}`;
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  function stop(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="flex gap-1" onClick={stop}>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noreferrer"
        className="grid size-8 place-items-center rounded-full bg-[#1877F2] text-xs font-bold text-white"
        aria-label="Facebook"
      >
        f
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noreferrer"
        className="grid size-8 place-items-center rounded-full bg-[#111] text-[10px] font-bold text-white"
        aria-label="X"
      >
        𝕏
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${text}%20${encoded}`}
        target="_blank"
        rel="noreferrer"
        className="grid size-8 place-items-center rounded-full bg-[#25D366] text-[10px] font-bold text-white"
        aria-label="WhatsApp"
      >
        W
      </a>
    </div>
  );
}
