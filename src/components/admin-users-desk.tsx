import { useEffect, useState } from "react";
import {
  deleteAppUser,
  listAppUsers,
  listChatWarnings,
  setUserName,
  setUserRole,
  type AppUserRow,
  type ChatWarning,
} from "@/lib/users";
import { ROLE_LABEL } from "@/lib/admin-access";
import { isAdminEmail } from "@/lib/admin";

function UserRow({
  user,
  onSaved,
  onError,
}: {
  user: AppUserRow;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name || "");
  }, [user.name]);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-line bg-paper px-3 py-2 text-sm font-semibold outline-none focus:border-crimson"
          aria-label="प्रयोगकर्ता नाम"
        />
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={saving || !name.trim() || name.trim() === (user.name || "")}
          className="rounded-full bg-crimson px-3 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          onClick={() => {
            setSaving(true);
            void setUserName({ data: { userId: user.id, name: name.trim() } })
              .then(onSaved)
              .catch((err) => onError(err instanceof Error ? err.message : "नाम सेभ भएन।"))
              .finally(() => setSaving(false));
          }}
        >
          {saving ? "…" : "नाम सेभ"}
        </button>
        <select
          value={user.role === "superadmin" ? "superadmin" : user.role}
          disabled={isAdminEmail(user.email)}
          onChange={(e) =>
            void setUserRole({
              data: { userId: user.id, role: e.target.value as "member" | "admin" | "eadmin" | "nadmin" },
            }).then(onSaved)
          }
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm disabled:opacity-60"
        >
          {isAdminEmail(user.email) ? <option value="superadmin">{ROLE_LABEL.superadmin}</option> : null}
          <option value="admin">{ROLE_LABEL.admin}</option>
          <option value="eadmin">{ROLE_LABEL.eadmin}</option>
          <option value="nadmin">{ROLE_LABEL.nadmin}</option>
          <option value="member">{ROLE_LABEL.member}</option>
        </select>
        {isAdminEmail(user.email) ? null : (
        <button
          type="button"
          className="text-sm font-semibold text-mark"
          onClick={() => {
            if (!window.confirm(`${user.email || user.name} मेट्ने?`)) return;
            void deleteAppUser({ data: { userId: user.id } })
              .then(onSaved)
              .catch((err) => onError(err instanceof Error ? err.message : "मेटिएन।"));
          }}
        >
          मेट्नुहोस्
        </button>
        )}
      </div>
    </li>
  );
}

export function UsersDeskPanel() {
  const [rows, setRows] = useState<AppUserRow[]>([]);
  const [warnings, setWarnings] = useState<ChatWarning[]>([]);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    void listAppUsers()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "प्रयोगकर्ता लोड भएन।"));
    void listChatWarnings()
      .then(setWarnings)
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">प्रयोगकर्ता र भूमिका</h2>
      <p className="mt-1 text-sm text-muted">
        सुपर एडमिन: सबै सेटिङ। एडमिन: समाचार, ग्यालरी, डाइरेक्ट्री, रक्तदाता, निर्वाचन।
        eadmin: निर्वाचन मात्र। nadmin: समाचार थप्न सकिन्छ, प्रकाशित मेट्न मिल्दैन।
      </p>
      {error ? <p className="mt-2 text-sm text-mark">{error}</p> : null}
      <ul className="mt-4 divide-y divide-line">
        {rows.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            onSaved={refresh}
            onError={(msg) => setError(msg)}
          />
        ))}
      </ul>
      <h3 className="mt-8 font-display text-xl">च्याट चेतावनी लग</h3>
      <ul className="mt-3 divide-y divide-line">
        {warnings.map((w) => (
          <li key={w.id} className="py-3 text-sm">
            <p className="font-semibold">{w.name} · {w.email}</p>
            <p className="text-muted">{w.body}</p>
          </li>
        ))}
        {!warnings.length ? <li className="py-3 text-sm text-muted">लग खाली छ।</li> : null}
      </ul>
    </section>
  );
}