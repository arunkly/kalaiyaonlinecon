import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, saveMyProfile } from "@/lib/member";

export function StatusComposer() {
  const { user } = useCurrentUserState();
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.displayName || "");
    void getMyProfile().then((p) => {
      setName(p.displayName || user.displayName || "");
      setPhoto(p.photoUrl || "");
      setAddress(p.address || "");
      setPhone(p.phone || "");
      setStatus(p.status || "");
    });
  }, [user]);

  if (!user) return null;

  return (
    <form
      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void saveMyProfile({
          data: {
            displayName: name || user.displayName || "सदस्य",
            photoUrl: photo,
            address,
            phone,
            status,
          },
        }).then(() => setOk(true));
      }}
    >
      {photo ? (
        <img src={photo} alt="" className="size-10 rounded-full object-cover" />
      ) : (
        <span className="grid size-10 place-items-center rounded-full bg-chip font-bold text-crimson">
          {(name || "स").charAt(0)}
        </span>
      )}
      <input
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setOk(false);
        }}
        placeholder="के सोचिरहनुभएको छ?"
        className="min-h-11 flex-1 rounded-full bg-[#f0f2f5] px-4 text-sm outline-none"
      />
      <button type="submit" className="rounded-full bg-[#148a4c] px-4 py-2 text-sm font-semibold text-white">
        पोस्ट
      </button>
      {ok ? <span className="text-xs text-crimson">सेभ भयो</span> : null}
    </form>
  );
}
