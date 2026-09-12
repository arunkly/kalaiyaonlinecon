import { createServerFn } from "@tanstack/react-start";
import { isAdminEmail } from "@/lib/admin";

export type AppRole = "superadmin" | "admin" | "eadmin" | "nadmin" | "member";

export type Cap =
  | "news"
  | "newsDelete"
  | "gallery"
  | "directory"
  | "blood"
  | "election"
  | "epaper"
  | "users"
  | "settings";

export const ROLE_LABEL: Record<AppRole, string> = {
  superadmin: "सुपर एडमिन",
  admin: "एडमिन",
  eadmin: "निर्वाचन एडमिन",
  nadmin: "समाचार एडमिन",
  member: "सदस्य",
};

const ROLE_CAPS: Record<AppRole, Cap[]> = {
  superadmin: ["news", "newsDelete", "gallery", "directory", "blood", "election", "epaper", "users", "settings"],
  admin: ["news", "newsDelete", "gallery", "directory", "blood", "election", "epaper"],
  eadmin: ["election"],
  nadmin: ["news"],
  member: [],
};

export function parseRole(value: string | null | undefined, email?: string | null): AppRole {
  if (isAdminEmail(email)) return "superadmin";
  if (value === "editor") return "nadmin";
  if (value === "superadmin" || value === "admin" || value === "eadmin" || value === "nadmin") return value;
  return "member";
}

export function capsOf(role: AppRole): Record<Cap, boolean> {
  const list = ROLE_CAPS[role];
  return {
    news: list.includes("news"),
    newsDelete: list.includes("newsDelete"),
    gallery: list.includes("gallery"),
    directory: list.includes("directory"),
    blood: list.includes("blood"),
    election: list.includes("election"),
    epaper: list.includes("epaper"),
    users: list.includes("users"),
    settings: list.includes("settings"),
  };
}

export function roleHas(role: AppRole, cap: Cap) {
  return ROLE_CAPS[role].includes(cap);
}

export type StaffAccess = {
  admin: boolean;
  role: AppRole;
  caps: Record<Cap, boolean>;
};

export async function getStaffRole(userId: string): Promise<AppRole> {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const session = await getSessionUser();
  if (!session || session.id !== userId) return "member";
  if (isAdminEmail(session.email)) return "superadmin";
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ role: string }>`
      select role from user_roles where user_id = ${userId} limit 1
    `;
    return parseRole(rows[0]?.role, session.email);
  } catch {
    return "member";
  }
}

export async function hasAdminAccess(userId: string) {
  const role = await getStaffRole(userId);
  return role !== "member";
}

export async function assertAppAdmin(userId: string) {
  if (!(await hasAdminAccess(userId))) {
    throw new Error("एडमिन खाताले मात्र यो काम गर्न सक्छ।");
  }
}

export async function assertCap(userId: string, cap: Cap) {
  const role = await getStaffRole(userId);
  if (!roleHas(role, cap)) {
    throw new Error("यो कामका लागि अनुमति छैन।");
  }
  return role;
}

export const getMyAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const session = await getSessionUser();
  if (!session?.id) {
    return { admin: false, role: "member" as AppRole, caps: capsOf("member") } satisfies StaffAccess;
  }
  const role = await getStaffRole(session.id);
  return { admin: role !== "member", role, caps: capsOf(role) } satisfies StaffAccess;
});
