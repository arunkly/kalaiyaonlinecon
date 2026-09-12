import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const incrementView = createServerFn({ method: "POST" })
  .validator(
    z.object({
      kind: z.enum(["story", "gallery", "directory"]),
      key: z.string().min(1).max(160),
    }),
  )
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (data.kind === "story") {
      const rows = await sql<{ views: number }>`
        update desk_stories set views = views + 1
        where slug = ${data.key} and deleted_at is null
        returning views
      `;
      return { views: Number(rows[0]?.views ?? 0) };
    }
    if (data.kind === "gallery") {
      const rows = await sql<{ views: number }>`
        update gallery_posts set views = views + 1
        where slug = ${data.key}
        returning views
      `;
      return { views: Number(rows[0]?.views ?? 0) };
    }
    const id = Number(data.key);
    const rows = await sql<{ views: number }>`
      update dir_entries set views = views + 1
      where id = ${id}
      returning views
    `;
    return { views: Number(rows[0]?.views ?? 0) };
  });

export const listStoryViews = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  try {
    const rows = await sql<{ slug: string; views: number }>`
      select slug, views from desk_stories
      where deleted_at is null
      order by views desc
      limit 30
    `;
    return rows.map((r) => ({ slug: r.slug, views: Number(r.views ?? 0) }));
  } catch {
    return [];
  }
});
