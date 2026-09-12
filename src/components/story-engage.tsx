import { Link } from "@tanstack/react-router";
import { ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyAccess } from "@/lib/admin-access";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { toNpDigits } from "@/data/articles";
import { cn } from "@/lib/cn";
import {
  addStoryComment,
  castStoryVote,
  deleteStoryComment,
  getStoryEngagement,
  type StoryComment,
} from "@/lib/engagement";

function guestVoter() {
  if (typeof window === "undefined") return "";
  const key = "ko-voter";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = `anon-${crypto.randomUUID()}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

export function StoryEngage({ slug }: { slug: string }) {
  const { user } = useCurrentUserState();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [admin, setAdmin] = useState(false);

  async function refresh() {
    const row = await getStoryEngagement({ data: { slug, guest: guestVoter() } });
    setLikes(row.likes);
    setDislikes(row.dislikes);
    setMyVote(row.myVote);
    setComments(row.comments);
  }

  useEffect(() => {
    void refresh().catch(() => undefined);
    void getMyAccess()
      .then((row) => setAdmin(row.admin))
      .catch(() => setAdmin(false));
  }, [slug]);

  async function vote(value: 1 | -1) {
    setError(null);
    try {
      await castStoryVote({ data: { slug, value, guest: guestVoter() } });
      await refresh();
    } catch {
      setError("भोट सेभ भएन।");
    }
  }

  async function onComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("कमेन्ट गर्न लगइन गर्नुहोस्।");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addStoryComment({ data: { slug, body } });
      setBody("");
      await refresh();
    } catch {
      setError("कमेन्ट सेभ भएन।");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteStoryComment({ data: { id } });
      await refresh();
    } catch {
      setError("कमेन्ट मेट्न सकिएन।");
    }
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => void vote(1)}
            className={cn(
              "inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition",
              myVote === 1
                ? "bg-crimson text-white shadow-md"
                : "text-ink-soft hover:bg-[#fff1f0] hover:text-crimson",
            )}
          >
            <ThumbsUp className={cn("size-5", myVote === 1 ? "fill-white" : "")} />
            लाइक {toNpDigits(likes)}
          </button>
          <span className="h-8 w-px bg-line" />
          <button
            type="button"
            onClick={() => void vote(-1)}
            className={cn(
              "inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition",
              myVote === -1
                ? "bg-[#c2410c] text-white shadow-md"
                : "text-ink-soft hover:bg-[#fff4e8] hover:text-[#c2410c]",
            )}
          >
            <ThumbsDown className={cn("size-5", myVote === -1 ? "fill-white" : "")} />
            डिसलाइक {toNpDigits(dislikes)}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="section-title">कमेन्ट</h2>
        {user ? (
          <form onSubmit={onComment} className="mt-4 space-y-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={2}
              rows={3}
              placeholder="तपाईंको प्रतिक्रिया लेख्नुहोस्…"
              className="w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-crimson"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {busy ? "पठाउँदै…" : "कमेन्ट गर्नुहोस्"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">
            कमेन्ट गर्न{" "}
            <Link to="/login" className="font-semibold text-crimson hover:underline">
              लगइन वा सदस्य बन्नुहोस्
            </Link>
            ।
          </p>
        )}
        {error ? <p className="mt-3 text-sm text-mark">{error}</p> : null}
        <ul className="mt-5 divide-y divide-line">
          {comments.length === 0 ? (
            <li className="py-4 text-sm text-muted">पहिलो कमेन्ट लेख्नुहोस्।</li>
          ) : (
            comments.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{c.author}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                  </div>
                  {user && (user.id === c.userId || admin) ? (
                    <button
                      type="button"
                      onClick={() => void onDelete(c.id)}
                      className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-mark"
                      aria-label="कमेन्ट मेट्नुहोस्"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
