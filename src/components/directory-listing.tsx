import { Link } from "@tanstack/react-router";
import { Eye, Mail, MapPin, Phone } from "lucide-react";
import { MiniShare } from "@/components/mini-share";
import { formatBsDateTime } from "@/lib/bs-date";
import { toNpDigits } from "@/data/articles";
import type { DirItem } from "@/lib/directory-desk";

export function DirectoryListing({
  item,
  categoryLabel,
  compact = false,
}: {
  item: DirItem;
  categoryLabel?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        to="/directory/$id"
        params={{ id: String(item.id) }}
        className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-chip"
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="grid size-14 place-items-center rounded-lg bg-chip text-[11px] text-muted">डाइरेक्ट्री</span>
        )}
        <div className="min-w-0">
          {categoryLabel ? <p className="text-[11px] font-semibold tracking-wider text-crimson">{categoryLabel}</p> : null}
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="truncate text-xs text-muted">{item.place}</p>
        </div>
      </Link>
    );
  }

  return (
    <article className="card-lift overflow-hidden rounded-2xl border border-line bg-surface">
      <Link to="/directory/$id" params={{ id: String(item.id) }} className="block cursor-pointer">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-48 w-full object-cover" />
        ) : (
          <div className="grid h-36 place-items-center bg-chip text-sm text-muted">तस्बिर छैन</div>
        )}
        <div className="p-4">
          {categoryLabel ? <p className="kicker">{categoryLabel}</p> : null}
          <h2 className="mt-1 font-display text-2xl font-normal">{item.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" /> {item.place}
            </span>
            {item.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-4" /> {item.phone}
              </span>
            ) : null}
            {item.email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-4" /> {item.email}
              </span>
            ) : null}
          </p>
          {item.note ? <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{item.note}</p> : null}
          {item.createdAt ? <p className="mt-1 text-xs text-muted">{formatBsDateTime(item.createdAt)}</p> : null}
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-line px-4 py-2">
        <MiniShare path={`/directory/${item.id}`} title={item.name} />
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Eye className="size-3.5" /> {toNpDigits(item.views || 0)}
        </span>
      </div>
    </article>
  );
}
