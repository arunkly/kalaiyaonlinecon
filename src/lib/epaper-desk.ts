import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";
import { adToBs, formatBs } from "@/lib/bs-date";

export type EpaperIssue = {
  id: number;
  issueDate: string;
  title: string;
  driveUrl: string;
  previewUrl: string;
  views: number;
  createdAt: string;
};

function driveFileId(raw: string) {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error("Google Drive लिंक सही छैन।");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("लिंक https हुनुपर्छ।");
  }
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== "drive.google.com" && host !== "docs.google.com") {
    throw new Error("Google Drive को PDF लिंक मात्र राख्नुहोस्।");
  }
  const fromPath = parsed.pathname.match(/\/(?:file|document|open)\/d\/([^/]+)/);
  if (fromPath?.[1]) return fromPath[1];
  const id = parsed.searchParams.get("id");
  if (id) return id;
  throw new Error("Drive फाइल ID भेटिएन। सेयर लिंक (anyone with the link) प्रयोग गर्नुहोस्।");
}

export function drivePreviewUrl(raw: string) {
  const id = driveFileId(raw);
  return `https://drive.google.com/file/d/${id}/preview`;
}

function dateIso(value: string) {
  const iso = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error("मिति सही छैन।");
  return iso;
}

function titleFor(date: string, title?: string) {
  const custom = title?.trim();
  if (custom) return custom.slice(0, 120);
  const bs = adToBs(date);
  return bs ? `ई-पेपर · ${formatBs(bs.year, bs.month, bs.day)}` : `ई-पेपर · ${date}`;
}

function mapRow(row: Omit<EpaperIssue, "previewUrl">): EpaperIssue {
  return { ...row, previewUrl: drivePreviewUrl(row.driveUrl) };
}

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists epaper_issues (
      id serial primary key,
      issue_date date not null,
      title text not null default '',
      drive_url text not null,
      views integer not null default 0,
      created_at timestamptz default now()
    )
  `;
  return sql;
}

export const listEpapers = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await ensureTable();
  const rows = await sql<Omit<EpaperIssue, "previewUrl">>`
    select id, to_char(issue_date, 'YYYY-MM-DD') as "issueDate", title, drive_url as "driveUrl",
           views, created_at as "createdAt"
    from epaper_issues
    order by issue_date desc, id desc
    limit 400
  `;
  return rows.map(mapRow);
});

export const getEpapersByDate = createServerFn({ method: "GET" })
  .validator(z.object({ date: z.string().min(8).max(12) }))
  .handler(async ({ data }) => {
    const sql = await ensureTable();
    const date = dateIso(data.date);
    const rows = await sql<Omit<EpaperIssue, "previewUrl">>`
      select id, to_char(issue_date, 'YYYY-MM-DD') as "issueDate", title, drive_url as "driveUrl",
             views, created_at as "createdAt"
      from epaper_issues
      where issue_date = ${date}::date
      order by id desc
    `;
    return rows.map(mapRow);
  });

export const bumpEpaperView = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const sql = await ensureTable();
    await sql`update epaper_issues set views = views + 1 where id = ${data.id}`;
    return { ok: true as const };
  });

export const saveEpaper = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number().optional(),
      issueDate: z.string().min(8).max(12),
      title: z.string().max(120).optional(),
      driveUrl: z.string().min(12).max(2000),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "epaper");
    const issueDate = dateIso(data.issueDate);
    const driveUrl = `https://drive.google.com/file/d/${driveFileId(data.driveUrl)}/view`;
    const title = titleFor(issueDate, data.title);
    const sql = await ensureTable();
    if (data.id) {
      await sql`
        update epaper_issues
        set issue_date = ${issueDate}::date, title = ${title}, drive_url = ${driveUrl}
        where id = ${data.id}
      `;
      return { ok: true as const, id: data.id };
    }
    const rows = await sql<{ id: number }>`
      insert into epaper_issues (issue_date, title, drive_url)
      values (${issueDate}::date, ${title}, ${driveUrl})
      returning id
    `;
    return { ok: true as const, id: rows[0]?.id ?? 0 };
  });

export const deleteEpaper = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "epaper");
    const sql = await ensureTable();
    await sql`delete from epaper_issues where id = ${data.id}`;
    return { ok: true as const };
  });
