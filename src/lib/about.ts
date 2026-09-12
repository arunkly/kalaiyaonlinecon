import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type AboutPage = {
  title: string;
  body: string;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  website: string;
  orgName: string;
  registrationNo: string;
  extraNote: string;
};

export const DEFAULT_ABOUT: AboutPage = {
  title: "हाम्रोबारे",
  body: "कलैयाअनलाइनले कलैया, बारा, पर्सा र तराई मधेशका स्थानीय समाचार समेट्छ।",
  phone: "",
  email: "",
  address: "कलैया, बारा, मधेश",
  facebook: "",
  website: "https://kalaiyaonline.com",
  orgName: "KalaiyaOnline",
  registrationNo: "",
  extraNote: "",
};

function text(value: unknown, fallback = "") {
  if (value == null) return fallback;
  return String(value);
}

function normalize(row: Partial<AboutPage> | null | undefined): AboutPage {
  return {
    title: text(row?.title, DEFAULT_ABOUT.title) || DEFAULT_ABOUT.title,
    body: text(row?.body, DEFAULT_ABOUT.body),
    phone: text(row?.phone),
    email: text(row?.email),
    address: text(row?.address, DEFAULT_ABOUT.address),
    facebook: text(row?.facebook),
    website: text(row?.website, DEFAULT_ABOUT.website),
    orgName: text(row?.orgName, DEFAULT_ABOUT.orgName) || DEFAULT_ABOUT.orgName,
    registrationNo: text(row?.registrationNo),
    extraNote: text(row?.extraNote),
  };
}

async function ensureAboutTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists about_page (
      id integer primary key,
      title text not null default 'हाम्रोबारे',
      body text not null default '',
      phone text not null default '',
      email text not null default '',
      address text not null default '',
      facebook text not null default '',
      website text not null default 'https://kalaiyaonline.com',
      org_name text not null default 'KalaiyaOnline',
      registration_no text not null default '',
      extra_note text not null default ''
    )
  `;
  await sql`alter table about_page add column if not exists org_name text not null default 'KalaiyaOnline'`;
  await sql`alter table about_page add column if not exists registration_no text not null default ''`;
  await sql`alter table about_page add column if not exists extra_note text not null default ''`;
  return sql;
}

export const getAboutPage = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await ensureAboutTable();
    const rows = await sql<Partial<AboutPage>>`
      select title, body, phone, email, address, facebook, website,
             org_name as "orgName", registration_no as "registrationNo", extra_note as "extraNote"
      from about_page where id = 1 limit 1
    `;
    return normalize(rows[0]);
  } catch {
    return DEFAULT_ABOUT;
  }
});

export const saveAboutPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      title: z.string().min(2).max(80),
      body: z.string().max(4000),
      phone: z.string().max(30).optional(),
      email: z.string().max(80).optional(),
      address: z.string().max(160).optional(),
      facebook: z.string().max(200).optional(),
      website: z.string().max(200).optional(),
      orgName: z.string().max(80).optional(),
      registrationNo: z.string().max(80).optional(),
      extraNote: z.string().max(400).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "settings");
    const sql = await ensureAboutTable();
    await sql`
      insert into about_page (id, title, body, phone, email, address, facebook, website, org_name, registration_no, extra_note)
      values (
        1,
        ${data.title.trim()},
        ${data.body.trim()},
        ${data.phone?.trim() ?? ""},
        ${data.email?.trim() ?? ""},
        ${data.address?.trim() ?? ""},
        ${data.facebook?.trim() ?? ""},
        ${data.website?.trim() ?? ""},
        ${data.orgName?.trim() ?? "KalaiyaOnline"},
        ${data.registrationNo?.trim() ?? ""},
        ${data.extraNote?.trim() ?? ""}
      )
      on conflict (id) do update set
        title = excluded.title,
        body = excluded.body,
        phone = excluded.phone,
        email = excluded.email,
        address = excluded.address,
        facebook = excluded.facebook,
        website = excluded.website,
        org_name = excluded.org_name,
        registration_no = excluded.registration_no,
        extra_note = excluded.extra_note
    `;
    return { ok: true };
  });
