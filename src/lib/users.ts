import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";
import { assertCap, parseRole, type AppRole } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type { AppRole };
export type AppUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
};

async function assertAdmin(userId: string) {
  await assertCap(userId, "users");
}

export const listPublicMembers = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const users = await sql<{ id: string; name: string | null }>`
    select id, name from "user" order by "createdAt" desc limit 200
  `;
  const profiles = await sql<{ userId: string; displayName: string; photoUrl: string; status: string }>`
    select user_id as "userId", display_name as "displayName", photo_url as "photoUrl", status
    from member_profiles
  `;
  return users.map((u) => {
    const p = profiles.find((x) => x.userId === u.id);
    return {
      id: u.id,
      name: p?.displayName || u.name || "सदस्य",
      photo: p?.photoUrl || "",
      status: p?.status || "",
    };
  });
});

export const getPublicProfile = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const users = await sql<{ id: string; name: string | null; email: string | null }>`
      select id, name, email from "user" where id = ${data.id} limit 1
    `;
    const user = users[0];
    if (!user) return null;
    const profiles = await sql<{
      displayName: string;
      photoUrl: string;
      address: string;
      phone: string;
      status: string;
    }>`
      select display_name as "displayName", photo_url as "photoUrl", address, phone, status
      from member_profiles
      where user_id = ${data.id}
      limit 1
    `;
    const p = profiles[0];
    return {
      id: user.id,
      name: p?.displayName || user.name || "सदस्य",
      photo: p?.photoUrl || "",
      address: p?.address || "",
      phone: p?.phone || "",
      status: p?.status || "",
    };
  });

export const listAppUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const users = await sql<{ id: string; name: string | null; email: string | null }>`
      select id, name, email from "user" order by "createdAt" desc
    `;
    const roles = await sql<{ userId: string; role: string }>`
      select user_id as "userId", role from user_roles
    `;
    const profiles = await sql<{ userId: string; displayName: string }>`
      select user_id as "userId", display_name as "displayName" from member_profiles
    `;
    return users.map((u) => ({
      id: u.id,
      name: profiles.find((p) => p.userId === u.id)?.displayName || u.name,
      email: u.email,
      role: parseRole(roles.find((r) => r.userId === u.id)?.role, u.email),
    })) satisfies AppUserRow[];
  });

export const setUserName = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1).max(80), name: z.string().trim().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const name = data.name.trim();
    await sql`update "user" set name = ${name} where id = ${data.userId}`;
    await sql`
      insert into member_profiles (user_id, display_name, updated_at)
      values (${data.userId}, ${name}, now())
      on conflict (user_id) do update set display_name = excluded.display_name, updated_at = now()
    `;
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1).max(80), role: z.enum(["member", "admin", "eadmin", "nadmin"]) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const target = await sql<{ email: string | null }>`
      select email from "user" where id = ${data.userId} limit 1
    `;
    if (isAdminEmail(target[0]?.email)) throw new Error("सुपर एडमिनको भूमिका बदल्न मिल्दैन।");
    await sql`
      insert into user_roles (user_id, role, updated_at)
      values (${data.userId}, ${data.role}, now())
      on conflict (user_id) do update set role = excluded.role, updated_at = now()
    `;
    return { ok: true };
  });

export const deleteAppUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("आफ्नो खाता मेट्न मिल्दैन।");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ email: string | null }>`
      select email from "user" where id = ${data.userId} limit 1
    `;
    if (isAdminEmail(rows[0]?.email)) throw new Error("मुख्य प्रशासक मेट्न मिल्दैन।");
    await sql`delete from member_profiles where user_id = ${data.userId}`;
    await sql`delete from user_roles where user_id = ${data.userId}`;
    await sql`delete from friend_links where user_id = ${data.userId} or peer_id = ${data.userId}`;
    await sql`delete from chat_messages where from_id = ${data.userId} or to_id = ${data.userId}`;
    await sql`delete from "session" where "userId" = ${data.userId}`;
    await sql`delete from "account" where "userId" = ${data.userId}`;
    await sql`delete from "user" where id = ${data.userId}`;
    return { ok: true };
  });

export type ChatWarning = {
  id: number;
  userId: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
};

export const listChatWarnings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return sql<ChatWarning>`
      select w.id, w.user_id as "userId", coalesce(u.name, 'सदस्य') as name,
             coalesce(u.email, '') as email, w.body, w.created_at as "createdAt"
      from chat_warnings w
      left join "user" u on u.id = w.user_id
      order by w.created_at desc
      limit 100
    `;
  });
