import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/admin";

const ADMIN_PASSWORD = "Aks##@@123";

export async function ensureAdminAccount() {
  const sql = await getSql();
  const existing = await sql<{ id: string }>`
    select id from "user" where lower(email) = ${ADMIN_EMAIL} limit 1
  `;
  if (existing.length > 0) return { created: false };

  await auth.api.signUpEmail({
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: "Arun Kumar Sah",
    },
  });
  return { created: true };
}
