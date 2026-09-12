import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getMyAccess } from "@/lib/admin-access";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile } from "@/lib/member";

export function AccountMenu() {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [out, setOut] = useState(false);
  const [admin, setAdmin] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setAdmin(false);
      setPhoto(null);
      return;
    }
    void getMyProfile()
      .then((p) => setPhoto(p.photoUrl || user.profileImageUrl))
      .catch(() => setPhoto(user.profileImageUrl));
    void getMyAccess()
      .then((row) => setAdmin(row.admin))
      .catch(() => setAdmin(false));
  }, [user]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (isPending) {
    return <div className="size-11 animate-pulse rounded-full bg-chip" />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-crimson shadow-sm hover:border-crimson"
        aria-label="लगइन"
      >
        <LogIn className="size-5" />
      </Link>
    );
  }

  const label = user.displayName ?? user.primaryEmail ?? "सदस्य";

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center overflow-hidden rounded-full border border-line bg-surface shadow-sm"
        aria-label="खाता"
        aria-expanded={open}
      >
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-5 text-crimson" />
        )}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-lg">
          <p className="truncate px-3 py-2 text-sm font-semibold">{label}</p>
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm hover:bg-chip"
          >
            मेरो प्रोफाइल
          </Link>
          <Link
            to="/account"
            search={{ tab: "password" }}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm hover:bg-chip"
          >
            पासवर्ड परिवर्तन
          </Link>
          {admin ? (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm hover:bg-chip"
            >
              प्रशासन डेस्क
            </Link>
          ) : null}
          {authEnabled ? (
            <button
              type="button"
              disabled={out}
              onClick={() => {
                setOut(true);
                void signOut().catch(() => setOut(false));
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-mark hover:bg-chip"
            >
              <LogOut className="size-4" />
              {out ? "बाहिरिँदै…" : "लगआउट"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
