import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type MailSettings = {
  fromEmail: string;
  fromName: string;
  hasKey: boolean;
};

export async function sendWelcomeEmail(to: string, name?: string) {
  const who = ((name || "").trim() || "सदस्य").replace(/[<>&]/g, "").slice(0, 80);
  const origin = (
    process.env.BETTER_AUTH_URL ||
    process.env.APP_URL ||
    "https://www.kalaiyaonline.com"
  ).replace(/\/$/, "");
  const html = `
    <div style="font-family:Mukta,Arial,sans-serif;line-height:1.7;color:#1b3d1f;max-width:560px">
      <p style="font-size:18px;font-weight:700">नमस्ते ${who},</p>
      <p>KalaiyaOnline मा स्वागत छ — कलैया, बारा र मधेशको स्थानीय समाचार एप।</p>
      <p>तपाईं यहाँ गर्न सक्नुहुन्छ:</p>
      <ul>
        <li>समाचार पढ्ने, लाइक/कमेन्ट गर्ने र सेभ गर्ने</li>
        <li>ग्यालरी हेर्ने र डाइरेक्ट्री खोज्ने</li>
        <li>दर्ता सदस्यसँग च्याट गर्ने (आपत्तिजनक शब्द नचलाउनुहोस्)</li>
        <li>रक्तदाता सूचीमा नाम राख्ने</li>
        <li>सेयर बजार, पात्रो र मौसम हेर्ने</li>
        <li>प्रोफाइल फोटो, मोबाइल र ठेगाना अद्यावधिक गर्ने</li>
      </ul>
      <p><a href="${origin}" style="color:#2E7D32">kalaiyaonline.com</a> मा लगइन गरेर सुरु गर्नुहोस्।</p>
      <p style="color:#666;font-size:13px">KalaiyaOnline टोली</p>
    </div>
  `;
  await sendAppEmail(to, "KalaiyaOnline मा स्वागत छ", html);
}

export const sendWelcomeMail = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), name: z.string().max(80).optional() }))
  .handler(async ({ data }) => {
    try {
      await sendWelcomeEmail(data.email, data.name);
    } catch {
      /* mail optional — signup should still succeed */
    }
    return { ok: true as const };
  });

export async function sendAppEmail(to: string, subject: string, html: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ fromEmail: string; fromName: string; resendKey: string }>`
    select from_email as "fromEmail", from_name as "fromName", resend_key as "resendKey"
    from mail_settings where id = 1 limit 1
  `;
  const cfg = rows[0];
  const key = process.env.RESEND_API_KEY || cfg?.resendKey || "";
  if (!key) {
    throw new Error("इमेल सेवा कन्फिगर छैन। डेस्कमा Resend API की राख्नुहोस्।");
  }
  const from = `${cfg?.fromName || "KalaiyaOnline"} <${cfg?.fromEmail || "noreply@kalaiyaonline.com"}>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 180) || "इमेल पठाउन सकिएन।");
  }
}

export const getMailSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertCap(context.userId, "settings");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ fromEmail: string; fromName: string; resendKey: string }>`
      select from_email as "fromEmail", from_name as "fromName", resend_key as "resendKey"
      from mail_settings where id = 1 limit 1
    `;
    return {
      fromEmail: rows[0]?.fromEmail || "noreply@kalaiyaonline.com",
      fromName: rows[0]?.fromName || "KalaiyaOnline",
      hasKey: Boolean(rows[0]?.resendKey || process.env.RESEND_API_KEY),
    } satisfies MailSettings;
  });

export const saveMailSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      fromEmail: z.string().email(),
      fromName: z.string().min(2).max(80),
      resendKey: z.string().max(400).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "settings");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (data.resendKey) {
      await sql`
        insert into mail_settings (id, from_email, from_name, resend_key)
        values (1, ${data.fromEmail}, ${data.fromName}, ${data.resendKey})
        on conflict (id) do update set
          from_email = excluded.from_email,
          from_name = excluded.from_name,
          resend_key = excluded.resend_key
      `;
    } else {
      await sql`
        insert into mail_settings (id, from_email, from_name)
        values (1, ${data.fromEmail}, ${data.fromName})
        on conflict (id) do update set
          from_email = excluded.from_email,
          from_name = excluded.from_name
      `;
    }
    return { ok: true };
  });
