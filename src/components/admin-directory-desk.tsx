import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Mail, MapPin, Phone, Tag, Type } from "lucide-react";
import {
  createDirCategory,
  createDirEntry,
  deleteDirCategory,
  deleteDirEntry,
  listDirCategories,
  listDirEntries,
  updateDirEntry,
  type DirCategory,
  type DirItem,
} from "@/lib/directory-desk";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function DirectoryDeskPanel() {
  const [cats, setCats] = useState<DirCategory[]>([]);
  const [items, setItems] = useState<DirItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [catLabel, setCatLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [place, setPlace] = useState("कलैया");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [sections, rows] = await Promise.all([listDirCategories(), listDirEntries()]);
    setCats(sections);
    setItems(rows);
    if (sections[0] && !category) setCategory(sections[0].slug);
  }

  useEffect(() => {
    void refresh().catch((err) => setError(String(err)));
  }, []);

  function reset() {
    setEditingId(null);
    setName("");
    setPlace("कलैया");
    setNote("");
    setPhone("");
    setEmail("");
    setImageUrl("");
    setMapUrl("");
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name,
        category,
        place,
        note,
        phone,
        email,
        imageUrl,
        mapUrl,
      };
      if (editingId) await updateDirEntry({ data: { id: editingId, ...payload } });
      else await createDirEntry({ data: payload });
      reset();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "प्रविष्टि सेभ भएन।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-mark">{error}</p> : null}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">डाइरेक्ट्री विभाग</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void createDirCategory({ data: { label: catLabel } })
              .then(() => {
                setCatLabel("");
                return refresh();
              })
              .catch((err) => setError(err instanceof Error ? err.message : "विभाग बनेन।"));
          }}
        >
          <input
            value={catLabel}
            onChange={(e) => setCatLabel(e.target.value)}
            required
            placeholder="जस्तै: स्वास्थ्य"
            className={field + " mt-0"}
          />
          <button className="shrink-0 rounded-full bg-crimson px-4 text-sm font-semibold text-paper">
            थप्नुहोस्
          </button>
        </form>
        <ul className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <li key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm">
              {c.label}
              <button
                type="button"
                className="text-mark"
                onClick={() => void deleteDirCategory({ data: { id: c.id } }).then(refresh)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={onSave} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">{editingId ? "प्रविष्टि सम्पादन" : "नयाँ डाइरेक्ट्री"}</h2>
        <label className="block text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <Type className="size-4 text-crimson" /> Listing Name
          </span>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={field} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Tag className="size-4 text-crimson" /> Category
            </span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-crimson" /> Location
            </span>
            <input value={place} onChange={(e) => setPlace(e.target.value)} required className={field} />
          </label>
        </div>
        <label className="block text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <Phone className="size-4 text-crimson" /> Phone Number
          </span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </label>
        <label className="block text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <Mail className="size-4 text-crimson" /> Email Address
          </span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label className="block text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <ImageIcon className="size-4 text-crimson" /> External Feature Image
          </span>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://"
            className={field}
          />
        </label>
        {imageUrl ? <img src={imageUrl} alt="" className="max-h-40 rounded-xl object-cover" /> : null}
        <label className="block text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <FileText className="size-4 text-crimson" /> Listing description
          </span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className={field} />
        </label>
        <p className="text-xs text-muted">नक्सा OpenStreetMap मा स्थानबाट स्वतः सेट हुन्छ।</p>
        <div className="flex gap-2">
          <button
            disabled={busy || !cats.length}
            className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {editingId ? "अपडेट" : "सेभ गर्नुहोस्"}
          </button>
          {editingId ? (
            <button type="button" onClick={reset} className="text-sm text-muted">
              रद्द
            </button>
          ) : null}
        </div>
      </form>

      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-display text-xl">{item.name}</p>
              <p className="text-sm text-muted">
                {cats.find((c) => c.slug === item.category)?.label ?? item.category} · {item.place}
                {item.phone ? ` · ${item.phone}` : ""}
              </p>
              {item.note ? <p className="mt-1 text-sm text-ink-soft">{item.note}</p> : null}
            </div>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className="text-crimson"
                onClick={() => {
                  setEditingId(item.id);
                  setName(item.name);
                  setCategory(item.category);
                  setPlace(item.place);
                  setNote(item.note);
                  setPhone(item.phone);
                  setEmail(item.email);
                  setImageUrl(item.imageUrl);
                }}
              >
                सम्पादन
              </button>
              <button
                type="button"
                className="text-mark"
                onClick={() => void deleteDirEntry({ data: { id: item.id } }).then(refresh)}
              >
                मेट्नुहोस्
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
