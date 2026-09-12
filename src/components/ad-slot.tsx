import { useEffect, useState } from "react";
import { listAdsBySlot, type AdItem } from "@/lib/ads";

export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const [ads, setAds] = useState<AdItem[]>([]);
  useEffect(() => {
    void listAdsBySlot({ data: { slot } })
      .then(setAds)
      .catch(() => setAds([]));
  }, [slot]);
  if (!ads.length) return null;
  return (
    <div className={`space-y-3 ${className}`}>
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

export function AdCard({ ad }: { ad: AdItem }) {
  const inner =
    ad.kind === "photo" && ad.imageUrl ? (
      <img src={ad.imageUrl} alt={ad.title || "विज्ञापन"} className="w-full rounded-xl object-cover" />
    ) : ad.kind === "html" && ad.html ? (
      <div
        className="ad-html text-sm"
        dangerouslySetInnerHTML={{ __html: ad.html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "") }}
      />
    ) : (
      <div className="rounded-xl border border-dashed border-line bg-chip px-4 py-3">
        <p className="text-[11px] font-bold tracking-widest text-muted">विज्ञापन</p>
        {ad.title ? <p className="mt-1 font-semibold">{ad.title}</p> : null}
        {ad.body ? <p className="mt-1 text-sm text-ink-soft">{ad.body}</p> : null}
      </div>
    );
  if (ad.href) {
    return (
      <a href={ad.href} target="_blank" rel="noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
