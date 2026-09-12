import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_EMAIL } from "@/lib/admin";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type ContactMessage = {
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists contact_messages (
      id serial primary key,
      name text not null,
      address text not null default '',
      email text not null,
      phone text not null default '',
      message text not null,
      created_at timestamptz not null default now()
    )
  `;
  return sql;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const submitContact = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2).max(80),
      address: z.string().min(2).max(160),
      email: z.string().email().max(120),
      phone: z.string().min(7).max(20),
      message: z.string().min(5).max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureTable();
    await sql`
      insert into contact_messages (name, address, email, phone, message)
      values (
        ${data.name.trim()},
        ${data.address.trim()},
        ${data.email.trim().toLowerCase()},
        ${data.phone.trim()},
        ${data.message.trim()}
      )
    `;
    try {
      const { sendAppEmail } = await import("@/lib/mail");
      const { getAboutPage } = await import("@/lib/about");
      const about = await getAboutPage();
      const to = about.email?.includes("@") ? about.email : ADMIN_EMAIL;
      const html = `
        <div style="font-family:Mukta,Arial,sans-serif;line-height:1.7;color:#1b3d1f">
          <p><strong>KalaiyaOnline सम्पर्क फारम</strong></p>
          <p>नाम: ${escapeHtml(data.name)}</p>
          <p>ठेगाना: ${escapeHtml(data.address)}</p>
          <p>इमेल: ${escapeHtml(data.email)}</p>
          <p>सम्पर्क नम्बर: ${escapeHtml(data.phone)}</p>
          <p>सन्देश:</p>
          <p>${escapeHtml(data.message).replace(/\n/g, "<br/>")}</p>
        </div>
      `;
      await sendAppEmail(to, `सम्पर्क: ${data.name}`, html);
    } catch {
      /* stored even if mail fails */
    }
    return { ok: true as const };
  });

export const listContactMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertCap(context.userId, "settings");
    const sql = await ensureTable();
    return sql<ContactMessage>`
      select id, name, address, email, phone, message, created_at as "createdAt"
      from contact_messages
      order by created_at desc
      limit 80
    `;
  });
