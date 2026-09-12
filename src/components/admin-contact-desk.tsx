import { useEffect, useState } from "react";
import { listContactMessages, type ContactMessage } from "@/lib/contact";
import { formatDate } from "@/data/articles";

export function ContactDeskPanel() {
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listContactMessages()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "सन्देश लोड भएन।"));
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl">सम्पर्क सन्देश</h2>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {!rows.length && !error ? <p className="text-sm text-muted">अहिले सन्देश छैन।</p> : null}
      <ul className="space-y-3">
        {rows.map((m) => (
          <li key={m.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">{m.name}</p>
            <p className="text-xs text-muted">{formatDate(m.createdAt)}</p>
            <p className="mt-2 text-sm">{m.address}</p>
            <p className="text-sm">
              <a className="text-crimson" href={`mailto:${m.email}`}>{m.email}</a>
              {" · "}
              <a className="text-crimson" href={`tel:${m.phone}`}>{m.phone}</a>
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
