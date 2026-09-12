import { useEffect, useState } from "react";
import {
  BLOOD_GROUPS,
  closeBloodRequest,
  createBloodDonor,
  deleteBloodDonor,
  deleteBloodRequest,
  listBloodDonors,
  listBloodRequests,
  updateBloodDonor,
  type BloodDonor,
  type BloodRequest,
} from "@/lib/blood-desk";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function BloodDeskPanel() {
  const [rows, setRows] = useState<BloodDonor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<(typeof BLOOD_GROUPS)[number]>("O+");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [lastDonated, setLastDonated] = useState("");
  const [available, setAvailable] = useState(true);
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    void listBloodDonors().then(setRows);
    void listBloodRequests().then(setRequests);
  }

  useEffect(() => {
    refresh();
  }, []);

  function fill(d: BloodDonor) {
    setEditingId(d.id);
    setName(d.name);
    setBloodGroup(d.bloodGroup as (typeof BLOOD_GROUPS)[number]);
    setPhone(d.phone);
    setPlace(d.place);
    setAge(d.age ? String(d.age) : "");
    setGender(d.gender);
    setLastDonated(d.lastDonated);
    setAvailable(d.available);
    setNote(d.note);
    setPhotoUrl(d.photoUrl);
  }

  const payload = {
    name,
    bloodGroup,
    phone,
    place,
    age: age ? Number(age) : undefined,
    gender,
    lastDonated,
    available,
    note,
    photoUrl,
  };

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      <form
        className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const run = editingId
            ? updateBloodDonor({
                data: {
                  ...payload,
                  id: editingId,
                  age: age ? Number(age) : undefined,
                },
              })
            : createBloodDonor({ data: { ...payload, age: age ? Number(age) : undefined } });
          void run
            .then(() => {
              setEditingId(null);
              setName("");
              setPhone("");
              setPlace("");
              setAge("");
              setNote("");
              setPhotoUrl("");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"));
        }}
      >
        <h2 className="font-display text-2xl">{editingId ? "दाता सम्पादन" : "नयाँ रक्तदाता"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            नाम
            <input value={name} onChange={(e) => setName(e.target.value)} required className={field} />
          </label>
          <label className="text-sm font-medium">
            रक्त समूह
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as (typeof BLOOD_GROUPS)[number])}
              className={field}
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            मोबाइल
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </label>
          <label className="text-sm font-medium">
            स्थान
            <input value={place} onChange={(e) => setPlace(e.target.value)} className={field} />
          </label>
          <label className="text-sm font-medium">
            उमेर
            <input value={age} onChange={(e) => setAge(e.target.value)} type="number" className={field} />
          </label>
          <label className="text-sm font-medium">
            लिङ्ग
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={field}>
              <option value="">—</option>
              <option value="पुरुष">पुरुष</option>
              <option value="महिला">महिला</option>
              <option value="अन्य">अन्य</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            पछिल्लो दान मिति
            <input type="date" value={lastDonated} onChange={(e) => setLastDonated(e.target.value)} className={field} />
          </label>
          <label className="text-sm font-medium">
            फोटो लिंक
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className={field} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          अहिले दान गर्न उपलब्ध
        </label>
        <label className="block text-sm font-medium">
          नोट
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={field} />
        </label>
        <button className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper">सेभ</button>
        {editingId ? (
          <button
            type="button"
            className="ml-3 text-sm text-muted"
            onClick={() => {
              setEditingId(null);
              setName("");
            }}
          >
            नयाँ फारम
          </button>
        ) : null}
      </form>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">आकस्मिक अनुरोध</h2>
        <ul className="mt-3 space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="font-semibold">
                  {r.patient} · {r.bloodGroup} {r.active ? "" : "· बन्द"}
                </p>
                <p className="text-sm text-muted">
                  {r.hospital} · {r.phone}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  className="text-crimson"
                  onClick={() => void closeBloodRequest({ data: { id: r.id, active: !r.active } }).then(refresh)}
                >
                  {r.active ? "बन्द" : "खोल्नुहोस्"}
                </button>
                <button type="button" className="text-mark" onClick={() => void deleteBloodRequest({ data: { id: r.id } }).then(refresh)}>
                  मेट्नुहोस्
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ul className="space-y-3">
        {rows.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
            <div>
              <p className="font-semibold">
                {d.name} · {d.bloodGroup}
              </p>
              <p className="text-sm text-muted">
                {d.place} {d.phone ? `· ${d.phone}` : ""}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button type="button" className="text-crimson" onClick={() => fill(d)}>
                सम्पादन
              </button>
              <button type="button" className="text-mark" onClick={() => void deleteBloodDonor({ data: { id: d.id } }).then(refresh)}>
                मेट्नुहोस्
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
