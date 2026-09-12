import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const email = data.email.trim().toLowerCase();
    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${email} limit 1
    `;
    if (!users[0]) {
      return { ok: true as const };
    }
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await sql`delete from password_resets where email = ${email}`;
    await sql`
      insert into password_resets (token, email, expires_at)
      values (${token}, ${email}, now() + interval '2 hours')
    `;
    const origin =
      process.env.BETTER_AUTH_URL ||
      process.env.APP_URL ||
      "https://kalaiyaonline.com";
    const link = `${origin.replace(/\/$/, "")}/reset-password?token=${token}`;
    const { sendAppEmail } = await import("@/lib/mail");
    await sendAppEmail(
      email,
      "KalaiyaOnline पासवर्ड रिकभरी",
      `<p>नमस्ते,</p><p>पासवर्ड रिसेट गर्न यो लिंक खोल्नुहोस् (२ घण्टा मान्य):</p><p><a href="${link}">${link}</a></p>`,
    );
    return { ok: true as const };
  });

export const completePasswordReset = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20).max(80),
      password: z.string().min(8).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const { hashPassword } = await import("better-auth/crypto");
    const sql = await getSql();
    const rows = await sql<{ email: string }>`
      select email from password_resets
      where token = ${data.token} and expires_at > now()
      limit 1
    `;
    const email = rows[0]?.email;
    if (!email) throw new Error("लिंक सकियो वा गलत छ।");
    const users = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${email} limit 1
    `;
    const userId = users[0]?.id;
    if (!userId) throw new Error("खाता भेटिएन।");
    const hash = await hashPassword(data.password);
    await sql`
      update "account"
      set password = ${hash}, "updatedAt" = now()
      where "userId" = ${userId} and "providerId" = 'credential'
    `;
    await sql`delete from password_resets where token = ${data.token}`;
    return { ok: true };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      currentPassword: z.string().min(1).max(80),
      newPassword: z.string().min(8).max(80),
    }),
  )
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const { hashPassword, verifyPassword } = await import("better-auth/crypto");
    const sql = await getSql();
    const rows = await sql<{ password: string | null }>`
      select password from "account"
      where "userId" = ${context.userId} and "providerId" = 'credential'
      limit 1
    `;
    const current = rows[0]?.password;
    if (!current) throw new Error("यो खातामा पासवर्ड छैन।");
    const ok = await verifyPassword({ hash: current, password: data.currentPassword });
    if (!ok) throw new Error("अहिलेको पासवर्ड मिलेन।");
    const hash = await hashPassword(data.newPassword);
    await sql`
      update "account"
      set password = ${hash}, "updatedAt" = now()
      where "userId" = ${context.userId} and "providerId" = 'credential'
    `;
    return { ok: true };
  });
