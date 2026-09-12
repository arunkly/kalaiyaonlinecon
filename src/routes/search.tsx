import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { byLatest } from "@/data/articles";
import { ArticleCard } from "@/components/article-card";
import { useEdition } from "@/lib/edition";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");
  const edition = useEdition();
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return edition
      .filter((a) =>
        [a.title, a.titleNp ?? "", a.excerpt, a.tags.join(" "), a.location, a.category]
          .join(" ")
          .toLowerCase()
          .includes(n),
      )
      .sort(byLatest);
  }, [q, edition]);

  return (
    <div>
      <h1 className="font-display text-4xl">खोज</h1>
      <label className="mt-5 flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-3">
        <Search className="size-5 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="शीर्षक, स्थान, ट्याग…"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          autoFocus
        />
      </label>
      <p className="mt-4 text-sm text-muted">
        {q.trim() ? `${results.length} नतिजा` : "माथि टाइप गर्नुहोस्"}
      </p>
      <div className="mt-6 space-y-1">
        {results.map((a) => (
          <ArticleCard key={a.slug} article={a} variant="text" />
        ))}
      </div>
    </div>
  );
}
