import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, List } from "lucide-react";
import { useEffect, useState } from "react";
import { articleHasCategory, byLatest } from "@/data/articles";
import { ArticleCard } from "@/components/article-card";
import { useEdition } from "@/lib/edition";
import { categoryLabel, useCategories } from "@/lib/use-categories";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

const VIEW_KEY = "ko-cat-view";

function CategoryPage() {
  const { slug } = Route.useParams();
  const cats = useCategories();
  const edition = useEdition();
  const [view, setView] = useState<"grid" | "list">("grid");
  const items = edition
    .filter((a) => articleHasCategory(a, slug, categoryLabel(cats, slug)))
    .sort(byLatest);

  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_KEY);
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);

  function choose(next: "grid" | "list") {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-crimson">विभाग</p>
          <h1 className="mt-2 font-display text-4xl">{categoryLabel(cats, slug)}</h1>
          <p className="mt-2 text-sm text-muted">{items.length} रिपोर्ट</p>
        </div>
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => choose("grid")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
              view === "grid" ? "bg-crimson text-paper" : "text-ink-soft hover:text-ink",
            )}
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="size-4" />
            ग्रिड
          </button>
          <button
            type="button"
            onClick={() => choose("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
              view === "list" ? "bg-crimson text-paper" : "text-ink-soft hover:text-ink",
            )}
            aria-pressed={view === "list"}
          >
            <List className="size-4" />
            सूची
          </button>
        </div>
      </div>
      {view === "grid" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white px-4">
          {items.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="compact" />
          ))}
        </div>
      )}
      {!items.length ? <p className="mt-8 text-sm text-muted">यो श्रेणीमा समाचार छैन।</p> : null}
    </div>
  );
}
