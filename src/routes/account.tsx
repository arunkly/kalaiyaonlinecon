import { Link, createFileRoute } from "@tanstack/react-router";
import { Camera, MapPin, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { MembersWidget } from "@/components/members-widget";
import { useFeature } from "@/components/features-provider";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { compressImage } from "@/lib/compress-image";
import { useEdition } from "@/lib/edition";
import { getMyActivity, getMyProfile, saveMyProfile } from "@/lib/member";
import { changeMyPassword } from "@/lib/password-reset";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/account")({
  validateSearch: z.object({
    tab: z.enum(["posts", "about", "password"]).optional(),
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const { tab: tabQuery } = Route.useSearch();
  const chatOn = useFeature("chat");
  const saved = usePrefs((s) => s.saved);
  const edition = useEdition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"posts" | "about" | "password">(tabQuery ?? "posts");
  const [comments, setComments] = useState<{ id: number; slug: string; body: string }[]>([]);
  const [votes, setVotes] = useState<{ slug: string; value: number }[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwOk, setPwOk] = useState(false);

  useEffect(() => {
    if (tabQuery) setTab(tabQuery);
  }, [tabQuery]);

  useEffect(() => {
    if (!user) return;
    setName(user.displayName ?? "");
    void getMyProfile()
      .then((p) => {
        setName(p.displayName || user.displayName || "");
        setPhoto(p.photoUrl || user.profileImageUrl || "");
        setAddress(p.address || "");
        setPhone(p.phone || "");
        setAge(p.age ? String(p.age) : "");
        setStatus(p.status || "");
      })
      .catch(() => undefined);
    void getMyActivity()
      .then((a) => {
        setComments(a.comments);
        setVotes(a.votes);
      })
      .catch(() => undefined);
  }, [user]);

  if (isPending) return <div className="h-40 animate-pulse rounded-2xl bg-chip" />;
  if (!user) return <RedirectToSignIn />;

  const savedStories = edition.filter((a) => saved.includes(a.slug));

  async function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("तस्बिर फाइल छान्नुहोस्।");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await compressImage(file);
      setPhoto(dataUrl);
      await saveMyProfile({
        data: {
          displayName: name.trim() || user?.displayName || "सदस्य",
          photoUrl: dataUrl,
          address,
          phone,
          age: age ? Number(age) : undefined,
          status,
        },
      });
      setSavedOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "फोटो अपलोड भएन।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="-mx-4 max-w-none sm:mx-0">
      <div className="overflow-hidden bg-white sm:rounded-b-2xl sm:border sm:border-line">
        <div className="relative h-44 bg-gradient-to-r from-[#148a4c] via-[#1aa35a] to-[#ff6f00] sm:h-56">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover opacity-40" />
          ) : null}
        </div>
        <div className="relative px-4 pb-4 sm:px-6">
          <div className="-mt-16 flex flex-col items-start gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    className="size-32 rounded-full border-4 border-white object-cover shadow-md sm:size-40"
                  />
                ) : (
                  <div className="grid size-32 place-items-center rounded-full border-4 border-white bg-[#d8dde1] text-4xl font-bold text-[#148a4c] shadow-md sm:size-40">
                    {(name || user.primaryEmail || "स").charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 grid size-10 place-items-center rounded-full border border-line bg-[#e4e6eb] text-ink shadow"
                  aria-label="प्रोफाइल फोटो"
                >
                  <Camera className="size-5" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    void onFile(file);
                  }}
                  className="sr-only"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex min-h-10 items-center rounded-md bg-[#148a4c] px-4 text-sm font-semibold text-white"
              >
                फोटो थप्नुहोस्
              </button>
              {chatOn ? (
              <Link
                to="/chat"
                className="inline-flex min-h-10 items-center gap-1 rounded-md bg-[#e4e6eb] px-4 text-sm font-semibold"
              >
                <MessageCircle className="size-4" />
                सन्देश
              </Link>
              ) : null}
            </div>
          </div>
          <div className="mt-3">
            <h1 className="font-display text-3xl font-extrabold">{name || "सदस्य"}</h1>
            {status ? <p className="mt-1 text-sm text-[#1c1e21]">“{status}”</p> : null}
            <p className="text-sm text-[#65676b]">{user.primaryEmail}</p>
            <button
              type="button"
              onClick={() => setTab("password")}
              className="mt-2 text-sm font-semibold text-[#148a4c] hover:underline"
            >
              पासवर्ड परिवर्तन
            </button>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-[#65676b]">
              <MapPin className="size-4" /> {address || "कलैया, बारा"}
            </p>
            {phone ? <p className="mt-1 text-sm text-[#65676b]">मोबाइल: {phone}</p> : null}
          </div>
          {error ? <p className="mt-2 text-sm text-mark">{error}</p> : null}
          {savedOk ? <p className="mt-2 text-sm text-[#148a4c]">{busy ? "सेभ हुँदै…" : "फोटो सेभ भयो।"}</p> : null}
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-[#e4e6eb] px-2">
          {(
            [
              ["posts", "पोस्ट"],
              ["about", "बारेमा"],
              ["password", "पासवर्ड"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`shrink-0 border-b-4 px-4 py-3 text-sm font-semibold ${
                tab === id ? "border-[#148a4c] text-[#148a4c]" : "border-transparent text-[#65676b]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-4 grid gap-4 lg:grid-cols-12 sm:mx-0">
        <aside className="space-y-3 lg:col-span-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="font-bold">परिचय</h2>
            <p className="mt-2 text-sm text-[#65676b]">KalaiyaOnline सदस्य</p>
            {status ? <p className="mt-2 text-sm">“{status}”</p> : null}
            {address ? <p className="mt-1 text-sm">{address}</p> : null}
            {phone ? <p className="mt-1 text-sm">{phone}</p> : null}
            {age ? <p className="mt-1 text-sm">{age} वर्ष</p> : null}
            <p className="mt-1 text-sm">सेभ {savedStories.length} · कमेन्ट {comments.length} · लाइक {votes.length}</p>
            <button
              type="button"
              onClick={() => setTab("password")}
              className="mt-3 text-sm font-semibold text-[#148a4c] hover:underline"
            >
              पासवर्ड परिवर्तन
            </button>
          </section>
          <MembersWidget />
        </aside>
        <section className="space-y-3 lg:col-span-8">
          {tab === "password" ? (
            <form
              className="space-y-3 rounded-xl border border-line bg-white p-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                setPwOk(false);
                if (newPassword.length < 8) {
                  setError("नयाँ पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setError("नयाँ पासवर्ड मिलेन।");
                  return;
                }
                setBusy(true);
                void changeMyPassword({ data: { currentPassword, newPassword } })
                  .then(() => {
                    setPwOk(true);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : "पासवर्ड परिवर्तन भएन।"))
                  .finally(() => setBusy(false));
              }}
            >
              <h2 className="font-semibold">पासवर्ड परिवर्तन</h2>
              <p className="text-sm text-[#65676b]">अहिलेको पासवर्ड लेखेर नयाँ पासवर्ड राख्नुहोस्।</p>
              <label className="block text-sm font-medium">
                अहिलेको पासवर्ड
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
                />
              </label>
              <label className="block text-sm font-medium">
                नयाँ पासवर्ड
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
                />
              </label>
              <label className="block text-sm font-medium">
                नयाँ पासवर्ड फेरि
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
                />
              </label>
              {pwOk ? <p className="text-sm text-[#148a4c]">पासवर्ड परिवर्तन भयो।</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={busy}
                  className="rounded-full bg-[#148a4c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "सेभ हुँदै…" : "पासवर्ड सेभ गर्नुहोस्"}
                </button>
                <Link to="/forgot-password" className="text-sm text-crimson hover:underline">
                  बिर्सनुभयो?
                </Link>
              </div>
            </form>
          ) : tab === "about" ? (
            <form
              className="space-y-3 rounded-xl border border-line bg-white p-4"
              onSubmit={(e) => {
                e.preventDefault();
                setBusy(true);
                void saveMyProfile({
                  data: {
                    displayName: name || user.displayName || "सदस्य",
                    photoUrl: photo,
                    address,
                    phone,
                    age: age ? Number(age) : undefined,
                    status,
                  },
                })
                  .then(() => setSavedOk(true))
                  .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
                  .finally(() => setBusy(false));
              }}
            >
              <h2 className="font-semibold">सम्पर्क विवरण</h2>
              <label className="block text-sm font-medium">
                मोबाइल नम्बर
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="९८xxxxxxxx"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
                />
              </label>
              <label className="block text-sm font-medium">
                स्थान
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="कलैया, बारा"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
                />
              </label>
              <label className="block text-sm font-medium">
                उमेर
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  type="number"
                  min={1}
                  max={120}
                  placeholder="उमेर"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
                />
              </label>
              <button
                disabled={busy}
                className="rounded-full bg-[#148a4c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                सेभ गर्नुहोस्
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-[#65676b]">
              प्रोफाइल होम
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
