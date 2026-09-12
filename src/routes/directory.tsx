import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { DirectoryListing } from "@/components/directory-listing";
import { cn } from "@/lib/cn";
import { listDirCategories, listDirEntries, type DirCategory, type DirItem } from "@/lib/directory-desk";

export const Route = createFileRoute("/directory")({ component: DirectoryLayout });

function DirectoryLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/directory" || pathname === "/directory/";
  return (
    <>
      {isIndex ? <DirectoryList /> : null}
      <Outlet />
    </>
  );
}

function DirectoryList() {
  const [cat, setCat] = useState("all");
  const [cats, setCats] = useState<DirCategory[]>([]);
  const [directory, setDirectory] = useState<DirItem[]>([]);

  useEffect(() => {
    void Promise.all([listDirCategories(), listDirEntries()]).then(([c, rows]) => {
      setCats(c);
      setDirectory(rows);
    });
  }, []);

  const items = useMemo(
    () => (cat === "all" ? directory : directory.filter((d) => d.category === cat)),
    [cat, directory],
  );

  return (
    <div>
      <h1 className="font-display text-4xl font-bold">डाइरेक्ट्री</h1>
      <AdSlot slot="directory" className="mt-4" />
      <p className="mt-2 max-w-xl text-sm text-muted">
        कार्डमा क्लिक गर्नुहोस्। तस्बिर, छोटो विवरण र नक्सा देखिन्छ।
      </p>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCat("all")}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm",
            cat === "all" ? "border-crimson bg-crimson text-paper" : "border-line bg-surface text-ink-soft",
          )}
        >
          सबै
        </button>
        {cats.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCat(c.slug)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm",
              cat === c.slug
                ? "border-crimson bg-crimson text-paper"
                : "border-line bg-surface text-ink-soft",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line-strong bg-surface px-5 py-12 text-center text-muted">
          डाइरेक्ट्री अहिले खाली छ।
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {items.map((d) => (
            <li key={d.id}>
              <DirectoryListing
                item={d}
                categoryLabel={cats.find((c) => c.slug === d.category)?.label ?? d.category}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
