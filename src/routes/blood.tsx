import { createFileRoute } from "@tanstack/react-router";
import { Droplet, Phone } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdSlot } from "@/components/ad-slot";
import { compressImage } from "@/lib/compress-image";
import {
  BLOOD_GROUPS,
  createBloodRequest,
  listBloodDonors,
  listBloodRequests,
  registerBloodDonor,
  type BloodDonor,
  type BloodRequest,
} from "@/lib/blood-desk";

export const Route = createFileRoute("/blood")({ component: BloodPage });

function BloodPage() {
  const [rows, setRows] = useState<BloodDonor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<(typeof BLOOD_GROUPS)[number]>("O+");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [age, setAge] = useState("");
  const [photo, setPhoto] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const [ok, setOk] = useState(false);
  const [reqOk, setReqOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState("");
  const [reqGroup, setReqGroup] = useState<(typeof BLOOD_GROUPS)[number]>("O+");
  const [hospital, setHospital] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [units, setUnits] = useState("1");
  const [neededBy, setNeededBy] = useState("");

  function refresh() {
    void listBloodDonors().then(setRows);
    void listBloodRequests().then(setRequests);
  }

  useEffect(() => {
    refresh();
  }, []);

  const visible = useMemo(() => {
    return rows.filter((d) => {
      if (group !== "all" && d.bloodGroup !== group) return false;
      if (q && !`${d.name} ${d.place}`.includes(q)) return false;
      return true;
    });
  }, [rows, group, q]);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#9B1C2C] to-[#14934e] px-5 py-8 text-white">
        <p className="text-[11px] font-bold tracking-[0.2em]">BLOOD DONOR</p>
        <h1 className="mt-2 font-display text-4xl font-bold">रक्तदाता पोर्टल</h1>
        <p className="mt-2 max-w-xl text-sm text-white/90">
          कलैया र बाराका दाता खोज्नुहोस्। समूह छानेर सम्पर्क गर्नुहोस्, वा आफू दाता बन्नुहोस्।
        </p>
      </div>
      <AdSlot slot="blood" />

      <section className="space-y-3">
        <h2 className="font-display text-2xl text-[#9B1C2C]">आकस्मिक अनुरोध</h2>
        {requests.filter((r) => r.active).length === 0 ? (
          <p className="text-sm text-muted">अहिले खुला आकस्मिक अनुरोध छैन।</p>
        ) : (
          requests
            .filter((r) => r.active)
            .map((r) => (
              <article key={r.id} className="rounded-2xl border border-[#9B1C2C]/30 bg-[#fff5f5] p-4">
                <p className="text-[11px] font-bold tracking-widest text-[#9B1C2C]">EMERGENCY · {r.bloodGroup}</p>
                <p className="mt-1 font-display text-xl">{r.patient}</p>
                <p className="text-sm text-muted">
                  {r.hospital || r.place}
                  {r.units ? ` · ${r.units} युनिट` : ""}
                  {r.neededBy ? ` · ${r.neededBy}` : ""}
                </p>
                {r.note ? <p className="mt-1 text-sm">{r.note}</p> : null}
                <a href={`tel:${r.phone}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#9B1C2C]">
                  <Phone className="size-4" /> {r.phone}
                </a>
              </article>
            ))
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGroup("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${group === "all" ? "bg-[#9B1C2C] text-white" : "border border-line bg-surface"}`}
        >
          सबै
        </button>
        {BLOOD_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${group === g ? "bg-[#9B1C2C] text-white" : "border border-line bg-surface"}`}
          >
            {g}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="नाम वा स्थान खोज्नुहोस्"
        className="w-full rounded-full border border-line bg-surface px-4 py-3 outline-none focus:border-crimson"
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {visible.length === 0 ? (
          <li className="col-span-full rounded-2xl border border-dashed border-line px-5 py-12 text-center text-muted">
            यो समूहमा दाता छैनन्।
          </li>
        ) : (
          visible.map((d) => (
            <li key={d.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                {d.photoUrl ? (
                  <img src={d.photoUrl} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <span className="grid size-14 place-items-center rounded-full bg-[#9B1C2C] text-white">
                    <Droplet className="size-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl">{d.name}</p>
                  <p className="text-sm font-bold text-[#9B1C2C]">{d.bloodGroup}</p>
                  <p className="text-sm text-muted">
                    {d.place}
                    {d.age ? ` · ${d.age} वर्ष` : ""}
                    {d.gender ? ` · ${d.gender}` : ""}
                  </p>
                  <p className="mt-1 text-xs">{d.available ? "उपलब्ध" : "अहिले उपलब्ध छैन"}</p>
                  {d.phone ? (
                    <a href={`tel:${d.phone}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-crimson">
                      <Phone className="size-4" /> {d.phone}
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <form
        className="space-y-3 rounded-2xl border border-[#9B1C2C]/25 bg-[#fff8f8] p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void createBloodRequest({
            data: {
              patient,
              bloodGroup: reqGroup,
              hospital,
              place: hospital,
              phone: reqPhone,
              units: Number(units) || 1,
              neededBy,
            },
          })
            .then(() => {
              setReqOk(true);
              setPatient("");
              setReqPhone("");
              setHospital("");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "अनुरोध सेभ भएन।"));
        }}
      >
        <h2 className="font-display text-2xl text-[#9B1C2C]">आकस्मिक रक्त अनुरोध</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="बिरामीको नाम" className="rounded-xl border border-line bg-paper px-3 py-3" />
          <select
            value={reqGroup}
            onChange={(e) => setReqGroup(e.target.value as (typeof BLOOD_GROUPS)[number])}
            className="rounded-xl border border-line bg-paper px-3 py-3"
          >
            {BLOOD_GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <input required value={reqPhone} onChange={(e) => setReqPhone(e.target.value)} placeholder="सम्पर्क नम्बर" className="rounded-xl border border-line bg-paper px-3 py-3" />
          <input value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="अस्पताल / स्थान" className="rounded-xl border border-line bg-paper px-3 py-3" />
          <input value={units} onChange={(e) => setUnits(e.target.value)} type="number" min={1} placeholder="युनिट" className="rounded-xl border border-line bg-paper px-3 py-3" />
          <input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className="rounded-xl border border-line bg-paper px-3 py-3" />
        </div>
        {reqOk ? <p className="text-sm text-[#9B1C2C]">आकस्मिक अनुरोध प्रकाशित भयो।</p> : null}
        <button className="rounded-full bg-[#9B1C2C] px-4 py-2 text-sm font-semibold text-white">अनुरोध पठाउनुहोस्</button>
      </form>

      <form
        className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          void registerBloodDonor({
            data: {
              name,
              bloodGroup,
              phone,
              place,
              age: age ? Number(age) : undefined,
              photoUrl: photo || undefined,
            },
          })
            .then(() => {
              setOk(true);
              setName("");
              setPhone("");
              setPlace("");
              setAge("");
              setPhoto("");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "दर्ता भएन।"));
        }}
      >
        <h2 className="font-display text-2xl">नयाँ रक्तदाता</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            नाम
            <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3" />
          </label>
          <label className="text-sm font-medium">
            रक्त समूह
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as (typeof BLOOD_GROUPS)[number])}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3"
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            मोबाइल नम्बर
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3" />
          </label>
          <label className="text-sm font-medium">
            स्थान
            <input required value={place} onChange={(e) => setPlace(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3" />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            प्रोफाइल फोटो
            <div className="mt-1 flex items-center gap-3">
              {photo ? (
                <img src={photo} alt="" className="size-14 rounded-full object-cover" />
              ) : (
                <span className="grid size-14 place-items-center rounded-full bg-[#9B1C2C] text-white">
                  <Droplet className="size-6" />
                </span>
              )}
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void compressImage(file)
                    .then(setPhoto)
                    .catch(() => setError("फोटो अपलोड भएन।"));
                }}
              />
              <button
                type="button"
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
                onClick={() => photoRef.current?.click()}
              >
                फोटो छान्नुहोस्
              </button>
            </div>
          </label>
        </div>
        {error ? <p className="text-sm text-mark">{error}</p> : null}
        {ok ? <p className="text-sm text-crimson">दाता सूचीमा थपियो।</p> : null}
        <button className="rounded-full bg-[#9B1C2C] px-4 py-2 text-sm font-semibold text-white">थप्नुहोस्</button>
      </form>
    </div>
  );
}
