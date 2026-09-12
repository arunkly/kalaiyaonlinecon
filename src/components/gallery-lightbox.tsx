import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import type { GalleryPhoto } from "@/lib/gallery-desk";

export function GalleryLightbox({
  title,
  photos,
  index,
  onClose,
  onIndex,
}: {
  title: string;
  photos: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onIndex]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink"
        aria-label="बन्द"
      >
        <X className="size-5" />
      </button>
      {photos.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-3 inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + photos.length) % photos.length);
            }}
            aria-label="अघिल्लो"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className="absolute right-3 inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink sm:right-16"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % photos.length);
            }}
            aria-label="अर्को"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      ) : null}
      <figure
        className="max-h-[90dvh] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.imageUrl}
          alt={photo.caption || title}
          className="max-h-[80dvh] w-full rounded-xl object-contain"
        />
        <figcaption className="mt-3 text-center text-sm text-paper">
          {title}
          {photo.caption ? ` · ${photo.caption}` : ""} · {index + 1}/{photos.length}
        </figcaption>
      </figure>
    </div>
  );
}
