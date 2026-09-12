import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

export type BloodDonor = {
  id: number;
  name: string;
  bloodGroup: string;
  phone: string;
  place: string;
  age: number | null;
  gender: string;
  lastDonated: string;
  available: boolean;
  note: string;
  photoUrl: string;
};

async function assertAdmin(userId: string) {
  await assertCap(userId, "blood");
}

const donorInput = z.object({
  name: z.string().min(2).max(80),
  bloodGroup: z.enum(BLOOD_GROUPS),
  phone: z.string().max(20).optional(),
  place: z.string().max(120).optional(),
  age: z.coerce.number().min(1).max(120).optional(),
  gender: z.string().max(20).optional(),
  lastDonated: z.string().max(20).optional(),
  available: z.boolean().optional(),
  note: z.string().max(300).optional(),
  photoUrl: z.string().max(220_000).optional(),
});

export const listBloodDonors = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  return sql<BloodDonor>`
    select d.id, d.name, d.blood_group as "bloodGroup", d.phone, d.place, d.age, d.gender,
           d.last_donated as "lastDonated", d.available, d.note,
           coalesce(nullif(d.photo_url, ''), p.photo_url, '') as "photoUrl"
    from blood_donors d
    left join member_profiles p on p.user_id = d.user_id
    order by d.available desc, d.name asc
  `;
});

export const createBloodDonor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(donorInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into blood_donors (
        name, blood_group, phone, place, age, gender, last_donated, available, note, photo_url
      ) values (
        ${data.name.trim()},
        ${data.bloodGroup},
        ${data.phone?.trim() ?? ""},
        ${data.place?.trim() ?? ""},
        ${data.age ?? null},
        ${data.gender?.trim() ?? ""},
        ${data.lastDonated?.trim() ?? ""},
        ${data.available ?? true},
        ${data.note?.trim() ?? ""},
        ${data.photoUrl?.trim() ?? ""}
      )
    `;
    return { ok: true };
  });

export const registerBloodDonor = createServerFn({ method: "POST" })
  .validator(donorInput)
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into blood_donors (
        name, blood_group, phone, place, age, gender, last_donated, available, note, photo_url
      ) values (
        ${data.name.trim()},
        ${data.bloodGroup},
        ${data.phone?.trim() ?? ""},
        ${data.place?.trim() ?? ""},
        ${data.age ?? null},
        ${data.gender?.trim() ?? ""},
        ${data.lastDonated?.trim() ?? ""},
        ${data.available ?? true},
        ${data.note?.trim() ?? ""},
        ${data.photoUrl?.trim() ?? ""}
      )
    `;
    return { ok: true };
  });


export const updateBloodDonor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(donorInput.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update blood_donors set
        name = ${data.name.trim()},
        blood_group = ${data.bloodGroup},
        phone = ${data.phone?.trim() ?? ""},
        place = ${data.place?.trim() ?? ""},
        age = ${data.age ?? null},
        gender = ${data.gender?.trim() ?? ""},
        last_donated = ${data.lastDonated?.trim() ?? ""},
        available = ${data.available ?? true},
        note = ${data.note?.trim() ?? ""},
        photo_url = ${data.photoUrl?.trim() ?? ""}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteBloodDonor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from blood_donors where id = ${data.id}`;
    return { ok: true };
  });

export type BloodRequest = {
  id: number;
  patient: string;
  bloodGroup: string;
  hospital: string;
  place: string;
  units: number;
  phone: string;
  neededBy: string;
  note: string;
  active: boolean;
  createdAt?: string;
};

const requestInput = z.object({
  patient: z.string().min(2).max(80),
  bloodGroup: z.enum(BLOOD_GROUPS),
  hospital: z.string().max(120).optional(),
  place: z.string().max(120).optional(),
  units: z.number().min(1).max(20).optional(),
  phone: z.string().min(7).max(20),
  neededBy: z.string().max(20).optional(),
  note: z.string().max(300).optional(),
});

export const listBloodRequests = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  return sql<BloodRequest>`
    select id, patient, blood_group as "bloodGroup", hospital, place, units, phone,
           needed_by as "neededBy", note, active, created_at as "createdAt"
    from blood_requests
    order by active desc, created_at desc
  `;
});

export const createBloodRequest = createServerFn({ method: "POST" })
  .validator(requestInput)
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into blood_requests (patient, blood_group, hospital, place, units, phone, needed_by, note, active)
      values (
        ${data.patient.trim()},
        ${data.bloodGroup},
        ${data.hospital?.trim() ?? ""},
        ${data.place?.trim() ?? ""},
        ${data.units ?? 1},
        ${data.phone.trim()},
        ${data.neededBy?.trim() ?? ""},
        ${data.note?.trim() ?? ""},
        true
      )
    `;
    return { ok: true };
  });

export const closeBloodRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number(), active: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`update blood_requests set active = ${data.active} where id = ${data.id}`;
    return { ok: true };
  });

export const deleteBloodRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from blood_requests where id = ${data.id}`;
    return { ok: true };
  });
