import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listPublicMembers } from "@/lib/users";

export const Route = createFileRoute("/members")({ component: MembersPage });

function MembersPage() {
  const [rows, setRows] = useState<{ id: string; name: string; photo: string; status: string }[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    void listPublicMembers().then(setRows);
  }, []);

  const visible = useMemo(() => {
    const s = q.trim();
    if (!s) return rows;
    return rows.filter((u) => u.name.includes(s) || u.status.includes(s));
  }, [rows, q]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl font-normal">दर्ता सदस्य</h1>
      <p className="text-sm text-muted">एपमा दर्ता भएका सबै सदस्य।</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="नाम खोज्नुहोस्"
        className="w-full max-w-md rounded-xl border border-line bg-paper px-3 py-3"
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((u) => (
          <li key={u.id}>
            <Link
              to="/member/$id"
              params={{ id: u.id }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-crimson"
            >
              {u.photo ? (
                <img src={u.photo} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-crimson text-sm font-bold text-paper">
                  {u.name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{u.name}</p>
                {u.status ? <p className="truncate text-xs text-muted">{u.status}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {!visible.length ? <p className="text-sm text-muted">सदस्य भेटिएन।</p> : null}
    </div>
  );
}
