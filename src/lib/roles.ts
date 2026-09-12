import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";
import { assertCap, parseRole, type AppRole } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export type { AppRole };

export type RegisteredUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
};

async function assertAdmin(userId: string) {
  await assertCap(userId, "users");
}

export const listRegisteredUsers = createServerFn({ method: "GET" })
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
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: parseRole(roles.find((r) => r.userId === u.id)?.role, u.email),
    })) satisfies RegisteredUser[];
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
