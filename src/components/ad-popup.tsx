import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AdCard } from "@/components/ad-slot";
import { listAdsBySlot, type AdItem, type PopupFreq } from "@/lib/ads";

const KEY = "ko-popup-ad";

function hoursFor(freq: PopupFreq) {
  if (freq === "hour") return 1;
  if (freq === "day") return 24;
  if (freq === "3day") return 72;
  if (freq === "week") return 168;
  return 0;
}

function isHidden(ad: AdItem) {
  const freq = ad.freq || "session";
  if (freq === "always") return false;
  const key = `${KEY}-${ad.id}`;
  try {
    if (freq === "session") return sessionStorage.getItem(key) === "1";
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    if (freq === "once") return true;
    const hours = hoursFor(freq);
    return Date.now() - Number(raw) < hours * 3600_000;
  } catch {
    return false;
  }
}

function remember(ad: AdItem) {
  const freq = ad.freq || "session";
  if (freq === "always") return;
  const key = `${KEY}-${ad.id}`;
  try {
    if (freq === "session") sessionStorage.setItem(key, "1");
    else localStorage.setItem(key, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function AdPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ad, setAd] = useState<AdItem | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setAd(null);
      return;
    }
    let timer = 0;
    void listAdsBySlot({ data: { slot: "popup" } })
      .then((rows) => {
        const next = rows[0];
        if (!next || isHidden(next)) {
          setAd(null);
          return;
        }
        const wait = Math.max(0, Number(next.delaySec) || 0) * 1000;
        timer = window.setTimeout(() => setAd(next), wait);
      })
      .catch(() => setAd(null));
    return () => {
      if (timer) window.clearTimeout(timer);
      setAd(null);
    };
  }, [pathname]);

  if (!ad) return null;
  const current = ad;

  function close() {
    remember(current);
    setAd(null);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        aria-label="बन्द गर्नुहोस्"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ad.title || "विज्ञापन"}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_80px_rgb(16_38_26/0.28)]"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[11px] font-bold tracking-[0.18em] text-crimson">विज्ञापन</p>
          <button
            type="button"
            onClick={close}
            className="grid size-9 place-items-center rounded-full bg-chip text-ink hover:bg-crimson hover:text-paper"
            aria-label="बन्द"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">
          <AdCard ad={ad} />
        </div>
      </div>
    </div>
  );
}
