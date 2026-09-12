import { useRouter } from "@tanstack/react-router";
import { Bell, BellRing, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyNotices, listPublicNotices, type AppNotice } from "@/lib/notifications";

const SEEN_KEY = "ko-notice-seen";
const PUSH_KEY = "ko-notice-push";

function seenAt() {
  try {
    return Number(localStorage.getItem(SEEN_KEY) || 0);
  } catch {
    return 0;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function NoticeBell() {
  const { user } = useCurrentUserState();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotice[]>([]);
  const [fresh, setFresh] = useState(0);
  const [pushOn, setPushOn] = useState(false);
  const [toast, setToast] = useState<AppNotice | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const known = useRef(new Set<string>());

  async function load() {
    const pub = await listPublicNotices().catch(() => [] as AppNotice[]);
    const mine = user ? await listMyNotices().catch(() => [] as AppNotice[]) : [];
    const all = [...mine, ...pub].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 16);
    const cutoff = seenAt();
    const unread = all.filter((n) => new Date(n.at).getTime() > cutoff);
    setItems(all);
    setFresh(unread.length);

    const allowPush =
      typeof window !== "undefined" &&
      localStorage.getItem(PUSH_KEY) === "1" &&
      "Notification" in window &&
      Notification.permission === "granted";

    for (const n of unread) {
      if (known.current.has(n.id)) continue;
      known.current.add(n.id);
      setToast(n);
      if (allowPush) {
        try {
          new Notification(n.kind === "chat" ? "नयाँ च्याट" : "KalaiyaOnline", {
            body: n.title,
            tag: n.id,
          });
        } catch {
          /* ignored */
        }
      }
    }
    if (!unread.length) {
      for (const n of all) known.current.add(n.id);
    }
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), user ? 8000 : 45_000);
    return () => window.clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    try {
      setPushOn(localStorage.getItem(PUSH_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  async function enablePush() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem(PUSH_KEY, "1");
      setPushOn(true);
      setToast({
        id: "push-on",
        kind: "post",
        title: "पुश सूचना अन भयो।",
        href: "/",
        at: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            markSeen();
            setFresh(0);
          }
        }}
        className={`relative inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface shadow-sm ${fresh ? "notice-bell-live" : ""}`}
        aria-label="सूचना"
      >
        {fresh ? <BellRing className="size-5 text-mark" /> : <Bell className="size-5 text-crimson" />}
        {fresh ? (
          <span className="absolute right-1 top-1 min-w-4 animate-[notice-badge_1s_ease-in-out_infinite] rounded-full bg-mark px-1 text-[10px] font-bold text-paper">
            {fresh}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 animate-[notice-overlay_220ms_ease-out]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl animate-[notice-pop_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-display text-2xl font-semibold tracking-normal">सूचना</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-10 items-center gap-1 rounded-full bg-chip px-3 text-sm font-semibold text-ink hover:bg-mark hover:text-paper"
                aria-label="बन्द"
              >
                <X className="size-4" />
                बन्द
              </button>
            </div>
            <div className="flex items-center justify-between px-5 py-2 text-xs">
              {pushOn ? (
                <span className="text-crimson">पुश अन</span>
              ) : (
                <button type="button" onClick={() => void enablePush()} className="font-semibold text-crimson">
                  पुश अन गर्नुहोस्
                </button>
              )}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-muted">अहिले सूचना छैन।</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className="border-t border-line">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        void router.navigate({ to: n.href as "/" });
                      }}
                      className="block w-full px-5 py-4 text-left text-sm hover:bg-chip"
                    >
                      {n.title}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mx-auto flex min-h-11 w-full max-w-48 items-center justify-center gap-2 rounded-full bg-crimson text-sm font-semibold text-paper hover:bg-crimson-deep"
              >
                <X className="size-4" />
                बन्द
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast && !open ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              setToast(null);
              void router.navigate({ to: toast.href as "/" });
            }}
            className="pointer-events-auto relative w-full max-w-sm rounded-2xl border border-line bg-surface px-5 py-4 text-left shadow-2xl animate-[notice-toast_500ms_cubic-bezier(0.2,0.9,0.2,1)]"
          >
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-chip"
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              aria-label="बन्द"
            >
              <X className="size-4" />
            </button>
            <p className="font-display text-sm font-semibold tracking-normal text-crimson">सूचना</p>
            <p className="mt-1 font-display text-lg font-semibold tracking-normal">{toast.title}</p>
          </button>
        </div>
      ) : null}
    </div>
  );
}
