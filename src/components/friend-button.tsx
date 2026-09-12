import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { acceptFriend, listFriends, requestFriend, type FriendRow } from "@/lib/social";

export function FriendButton({ peerId }: { peerId: string }) {
  const { user } = useCurrentUserState();
  const [row, setRow] = useState<FriendRow | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!user) {
      setRow(null);
      return;
    }
    const friends = await listFriends();
    setRow(friends.find((f) => f.id === peerId) ?? null);
  }

  useEffect(() => {
    void refresh().catch(() => setRow(null));
  }, [user, peerId]);

  if (!user) {
    return (
      <Link to="/login" className="inline-flex min-h-9 items-center rounded-full bg-[#148a4c] px-3 text-xs font-semibold text-white">
        साथी बनाउन लगइन
      </Link>
    );
  }
  if (user.id === peerId) return null;

  if (row?.status === "accepted") {
    return (
      <Link to="/chat" className="inline-flex min-h-9 items-center rounded-full bg-[#e4e6eb] px-3 text-xs font-semibold">
        साथी · च्याट
      </Link>
    );
  }
  if (row?.incoming) {
    return (
      <button
        type="button"
        disabled={busy}
        className="inline-flex min-h-9 items-center rounded-full bg-[#148a4c] px-3 text-xs font-semibold text-white disabled:opacity-60"
        onClick={() => {
          setBusy(true);
          void acceptFriend({ data: { peerId } })
            .then(refresh)
            .finally(() => setBusy(false));
        }}
      >
        स्वीकार
      </button>
    );
  }
  if (row?.status === "pending") {
    return (
      <span className="inline-flex min-h-9 items-center rounded-full bg-[#e4e6eb] px-3 text-xs font-semibold text-muted">
        अनुरोध पठाइयो
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      className="inline-flex min-h-9 items-center rounded-full bg-[#148a4c] px-3 text-xs font-semibold text-white disabled:opacity-60"
      onClick={() => {
        setBusy(true);
        void requestFriend({ data: { peerId } })
          .then(refresh)
          .finally(() => setBusy(false));
      }}
    >
      साथी बनाउनुहोस्
    </button>
  );
}
