import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export type MemberProfile = {
  userId: string;
  displayName: string;
  photoUrl: string;
  address: string;
  phone: string;
  status: string;
  age: number | null;
};

export type MemberActivity = {
  comments: { id: number; slug: string; body: string; createdAt: string }[];
  votes: { slug: string; value: number; createdAt: string }[];
};

const emptyProfile = (userId: string): MemberProfile => ({
  userId,
  displayName: "",
  photoUrl: "",
  address: "",
  phone: "",
  status: "",
  age: null,
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<MemberProfile>`
      select user_id as "userId", display_name as "displayName", photo_url as "photoUrl",
             address, phone, status, age
      from member_profiles
      where user_id = ${context.userId}
      limit 1
    `;
    return rows[0] ?? emptyProfile(context.userId);
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      displayName: z.string().min(1).max(80),
      photoUrl: z.string().max(220_000).optional(),
      address: z.string().max(160).optional(),
      phone: z.string().max(20).optional(),
      status: z.string().max(200).optional(),
      age: z.coerce.number().min(1).max(120).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const photo = data.photoUrl?.trim() ?? "";
    if (photo && !photo.startsWith("http") && !photo.startsWith("data:image/")) {
      throw new Error("फोटो लिंक वा तस्बिर हुनुपर्छ।");
    }
    await sql`
      insert into member_profiles (user_id, display_name, photo_url, address, phone, status, age, updated_at)
      values (
        ${context.userId},
        ${data.displayName.trim()},
        ${photo},
        ${data.address?.trim() ?? ""},
        ${data.phone?.trim() ?? ""},
        ${data.status?.trim() ?? ""},
        ${data.age ?? null},
        now()
      )
      on conflict (user_id)
      do update set
        display_name = excluded.display_name,
        photo_url = case when excluded.photo_url = '' then member_profiles.photo_url else excluded.photo_url end,
        address = excluded.address,
        phone = excluded.phone,
        status = excluded.status,
        age = excluded.age,
        updated_at = now()
    `;
    await sql`
      update "user" set name = ${data.displayName.trim()} where id = ${context.userId}
    `;
    return { ok: true };
  });

export const getMyActivity = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const comments = await sql<{
      id: number;
      slug: string;
      body: string;
      createdAt: string;
    }>`
      select id, slug, body, created_at as "createdAt"
      from desk_comments
      where user_id = ${context.userId}
      order by created_at desc
      limit 40
    `;
    const votes = await sql<{
      slug: string;
      value: number;
      createdAt: string;
    }>`
      select slug, value, created_at as "createdAt"
      from desk_votes
      where user_id = ${context.userId}
      order by created_at desc
      limit 40
    `;
    return { comments, votes } satisfies MemberActivity;
  });
