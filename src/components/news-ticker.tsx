import { Link } from "@tanstack/react-router";
import { Newspaper, Power } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { byLatest, displayTitle, type Article } from "@/data/articles";
import { NewsTitle } from "@/components/news-title";
import { deskToArticle } from "@/lib/edition";
import { listPublishedStories } from "@/lib/desk";

const STORAGE_KEY = "ko-news-ticker";

export function NewsTicker() {
  const [stories, setStories] = useState<Article[]>([]);
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(window.localStorage.getItem(STORAGE_KEY) !== "off");
    void listPublishedStories()
      .then((rows) =>
        setStories(
          (rows ?? []).flatMap((row) => {
            try {
              return [deskToArticle(row)];
            } catch {
              return [];
            }
          }),
        ),
      )
      .catch(() => undefined);
  }, []);

  function toggle() {
    setOn((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      return next;
    });
  }

  const items = useMemo(() => [...stories].sort(byLatest).slice(0, 20), [stories]);

  if (!on) {
    return (
      <div className="border-b border-crimson/20 bg-chip">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-1.5">
          <p className="text-[11px] font-semibold text-muted">समाचार टिकर बन्द छ</p>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-crimson px-3 text-[11px] font-bold text-paper"
          >
            <Power className="size-3.5" />
            अन गर्नुहोस्
          </button>
        </div>
      </div>
    );
  }

  const chips = items.length
    ? items.map((a) => (
        <Link
          key={a.slug}
          to="/article/$slug"
          params={{ slug: a.slug }}
          className="mx-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-paper hover:bg-white/15"
        >
          <span className="size-1.5 rounded-full bg-mark" />
          <NewsTitle text={displayTitle(a)} />
        </Link>
      ))
    : [
        <span key="empty" className="px-3 text-sm text-paper/70">
          ताजा समाचार आउँदैछ…
        </span>,
      ];

  return (
    <div className="border-b border-crimson-deep bg-[#0f3d24] text-paper">
      <div className="mx-auto flex max-w-6xl items-stretch">
        <span className="flex shrink-0 items-center gap-2 bg-mark px-3 py-2 text-[11px] font-extrabold tracking-[0.14em] text-ink">
          <Newspaper className="size-3.5" />
          ताजा
        </span>
        <div className="news-ticker-mask min-w-0 flex-1 overflow-hidden">
          <div className="news-ticker-track py-2">
            {chips}
            {chips}
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={on}
          aria-label="समाचार टिकर अफ"
          className="flex shrink-0 items-center gap-1.5 border-l border-white/10 px-3 text-[11px] font-bold text-paper/80 hover:bg-white/10"
        >
          <Power className="size-3.5" />
          अफ
        </button>
      </div>
    </div>
  );
}
