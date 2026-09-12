import { useEffect, useState } from "react";
import { toNpDigits } from "@/data/articles";
import { adToBs, formatBs, todayIso } from "@/lib/bs-date";
import { deleteEpaper, listEpapers, saveEpaper, type EpaperIssue } from "@/lib/epaper-desk";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function EpaperDeskPanel() {
  const [rows, setRows] = useState<EpaperIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState(todayIso());
  const [title, setTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  function refresh() {
    void listEpapers()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "ई-पेपर लोड भएन।"));
  }

  useEffect(() => {
    refresh();
  }, []);

  const bs = adToBs(issueDate);

  function reset() {
    setEditingId(null);
    setIssueDate(todayIso());
    setTitle("");
    setDriveUrl("");
  }

  return (
    <section className="space-y-5 rounded-2xl border border-line bg-surface p-5">
      <div>
        <h2 className="font-display text-2xl">ई-पेपर डेस्क</h2>
        <p className="mt-1 text-sm text-muted">
          Google Drive मा PDF सेयर गरेर लिंक राख्नुहोस् (Anyone with the link can view)। मितिअनुसार साइटमा प्रिभ्यू हुन्छ।
        </p>
      </div>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {ok ? <p className="text-sm font-semibold text-[#14934e]">{ok}</p> : null}
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setOk(null);
          void saveEpaper({
            data: { id: editingId ?? undefined, issueDate, title, driveUrl },
          })
            .then(() => {
              setOk(editingId ? "ई-पेपर अद्यावधिक भयो।" : "ई-पेपर थपियो।");
              reset();
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
            .finally(() => setBusy(false));
        }}
      >
        <label className="text-sm font-medium">
          मिति (ई.सं.)
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required className={field} />
          {bs ? <span className="mt-1 block text-xs text-muted">वि.सं. {formatBs(bs.year, bs.month, bs.day)}</span> : null}
        </label>
        <label className="text-sm font-medium">
          शीर्षक (खाली छोडे मितिबाट बन्छ)
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="कलैया अनलाइन ई-पेपर" />
        </label>
        <label className="text-sm font-medium">
          Google Drive PDF लिंक
          <input
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            required
            className={field}
            placeholder="https://drive.google.com/file/d/.../view"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60">
            {busy ? "सेभ हुँदै…" : editingId ? "अद्यावधिक" : "ई-पेपर थप्नुहोस्"}
          </button>
          {editingId ? (
            <button type="button" onClick={reset} className="rounded-full border border-line px-4 py-2 text-sm">
              रद्द
            </button>
          ) : null}
        </div>
      </form>
      <ul className="divide-y divide-line">
        {rows.map((row) => {
          const label = adToBs(row.issueDate);
          return (
            <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{row.title}</p>
                <p className="text-sm text-muted">
                  {label ? formatBs(label.year, label.month, label.day) : row.issueDate} · हेराइ {toNpDigits(row.views)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-sm text-crimson"
                  onClick={() => {
                    setEditingId(row.id);
                    setIssueDate(row.issueDate);
                    setTitle(row.title);
                    setDriveUrl(row.driveUrl);
                  }}
                >
                  सम्पादन
                </button>
                <button
                  type="button"
                  className="text-sm text-mark"
                  onClick={() => {
                    if (!window.confirm("यो ई-पेपर मेट्ने?")) return;
                    void deleteEpaper({ data: { id: row.id } }).then(refresh);
                  }}
                >
                  मेट्नुहोस्
                </button>
              </div>
            </li>
          );
        })}
        {!rows.length ? <li className="py-3 text-sm text-muted">अहिले ई-पेपर छैन।</li> : null}
      </ul>
    </section>
  );
}
