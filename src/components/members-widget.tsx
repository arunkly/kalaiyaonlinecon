import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FriendButton } from "@/components/friend-button";
import { listPublicMembers } from "@/lib/users";

export function MembersWidget() {
  const [rows, setRows] = useState<{ id: string; name: string; photo: string; status: string }[]>([]);
  useEffect(() => {
    void listPublicMembers()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <p className="section-title">दर्ता सदस्य</p>
      <p className="mt-2 text-xs text-muted">{rows.length} जना</p>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-muted">अहिले सदस्य देखिएनन्।</li>
        ) : (
          rows.slice(0, 10).map((u) => (
            <li key={u.id} className="flex items-center gap-2">
              <Link
                to="/member/$id"
                params={{ id: u.id }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 hover:bg-chip"
              >
                {u.photo ? (
                  <img src={u.photo} alt="" className="size-9 rounded-full object-cover" />
                ) : (
                  <span className="grid size-9 place-items-center rounded-full bg-chip text-sm font-bold text-crimson">
                    {u.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  {u.status ? <p className="truncate text-xs text-muted">{u.status}</p> : null}
                </div>
              </Link>
              <FriendButton peerId={u.id} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
