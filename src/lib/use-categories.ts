import { useEffect, useState } from "react";
import { CATEGORIES } from "@/data/articles";
import { listCategories, type DeskCategory } from "@/lib/desk";

const FALLBACK: DeskCategory[] = CATEGORIES.map((c, i) => ({
  id: i + 1,
  slug: c.slug,
  label: c.labelNp,
}));

export function useCategories() {
  const [cats, setCats] = useState<DeskCategory[]>(FALLBACK);

  useEffect(() => {
    void listCategories()
      .then((rows) => {
        if (rows.length) setCats(rows);
      })
      .catch(() => undefined);
  }, []);

  return cats;
}

export function categoryLabel(cats: DeskCategory[], slug: string) {
  return cats.find((c) => c.slug === slug)?.label ?? slug;
}
