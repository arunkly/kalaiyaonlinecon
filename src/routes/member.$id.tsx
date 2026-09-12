import { Link, createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { FriendButton } from "@/components/friend-button";
import { MembersWidget } from "@/components/members-widget";
import { getPublicProfile } from "@/lib/users";

export const Route = createFileRoute("/member/$id")({ component: PublicProfile });

function PublicProfile() {
  const { id } = Route.useParams();
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    photo: string;
    address: string;
    phone: string;
    status: string;
  } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void getPublicProfile({ data: { id } }).then((row) => {
      setProfile(row);
      setMissing(!row);
    });
  }, [id]);

  if (missing) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl font-bold">प्रोफाइल भेटिएन</h1>
        <Link to="/" className="mt-4 inline-block text-crimson">
          गृह
        </Link>
      </div>
    );
  }
  if (!profile) return <div className="h-40 animate-pulse rounded-2xl bg-chip" />;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="lg:col-span-8">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="h-36 bg-gradient-to-r from-[#148a4c] to-[#ff6f00]" />
          <div className="-mt-12 px-5 pb-5">
            {profile.photo ? (
              <img src={profile.photo} alt="" className="size-24 rounded-full border-4 border-white object-cover" />
            ) : (
              <div className="grid size-24 place-items-center rounded-full border-4 border-white bg-chip text-2xl font-bold text-crimson">
                {profile.name.charAt(0)}
              </div>
            )}
            <h1 className="mt-3 font-display text-3xl font-bold">{profile.name}</h1>
            <div className="mt-3">
              <FriendButton peerId={profile.id} />
            </div>
            {profile.status ? <p className="mt-1 text-ink-soft">“{profile.status}”</p> : null}
            {profile.address ? (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-4" /> {profile.address}
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <aside className="lg:col-span-4">
        <MembersWidget />
      </aside>
    </div>
  );
}
