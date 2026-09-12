import { Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  Camera,
  Droplet,
  Home,
  Info,
  LineChart,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Phone,
  Shield,
  Type,
  Users,
  Vote,
} from "lucide-react";
import type { AboutPage } from "@/lib/about";
import { AppLogo } from "@/components/app-logo";
import { useFeatures } from "@/components/features-provider";
import { useSite } from "@/components/site-provider";
import { chromeItems } from "@/lib/chrome-nav";
import { toNpDigits } from "@/data/articles";

const ICONS: Record<string, typeof Home> = {
  home: Home,
  gallery: Camera,
  directory: Building2,
  blood: Droplet,
  election: Vote,
  epaper: Newspaper,
  chat: MessageCircle,
  members: Users,
  market: LineChart,
  patro: CalendarDays,
  dateConverter: CalendarDays,
  preeti: Type,
  about: Info,
  privacy: Shield,
};

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[#e8efe9] transition hover:border-[#ffd27a]/50 hover:bg-[#ffd27a]/10 hover:text-[#ffd27a]";

export function SiteFooter({ about }: { about: AboutPage | null }) {
  const features = useFeatures();
  const site = useSite();
  const links = chromeItems(site.footerMenu, features);
  const brand = about?.orgName || site.nameNp || site.name;
  const blurb = String(about?.body || site.tagline || site.description).slice(0, 160);

  return (
    <footer className="border-t border-line bg-[#10261a] text-[#e8efe9]">
      <div className="h-1 bg-gradient-to-r from-crimson via-mark to-crimson" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:py-12">
        <div>
          <AppLogo variant="dark" className="h-10 w-auto" />
          <p className="mt-3 font-display text-lg">{brand}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{blurb}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-mark">सम्पर्क</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {about?.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-mark" />
                {about.address}
              </p>
            ) : null}
            {about?.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-mark" />
                <a href={`tel:${about.phone}`}>{about.phone}</a>
              </p>
            ) : null}
            {about?.email ? (
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-mark" />
                <a href={`mailto:${about.email}`}>{about.email}</a>
              </p>
            ) : null}
            {about?.website ? (
              <a href={String(about.website)} className="block hover:text-mark">
                {String(about.website).replace(/^https?:\/\//, "")}
              </a>
            ) : null}
            {about?.facebook ? (
              <a href={about.facebook} className="block hover:text-mark">
                फेसबुक
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-mark">दर्ता विवरण</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {about?.orgName ? <p>{about.orgName}</p> : null}
            {about?.registrationNo ? <p>दर्ता नम्बर: {about.registrationNo}</p> : null}
            {about?.extraNote ? <p className="whitespace-pre-wrap text-white/70">{about.extraNote}</p> : null}
            {!about?.registrationNo && !about?.extraNote ? (
              <p className="text-white/50">हाम्रोबारेबाट दर्ता विवरण थप्नुहोस्।</p>
            ) : null}
          </div>
        </div>
        <div className="sm:col-span-3">
          <p className="text-[11px] font-bold tracking-[0.18em] text-mark">मेनु</p>
          <nav className="mt-3 flex flex-wrap gap-2 text-sm">
            {links.map((item) => {
              const Icon = ICONS[item.key] || Home;
              return (
                <Link key={item.to} to={item.to as "/"} className={chip}>
                  <Icon className="size-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#0b1a12] px-4 py-4 pb-28 sm:px-6 lg:pb-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center text-xs sm:flex-row sm:text-left">
          <p className="text-white/45">© {toNpDigits(new Date().getFullYear())} {brand}</p>
          <a
            href="https://www.facebook.com/kalaiyabara"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 font-medium text-[#ffd27a] underline underline-offset-4 hover:text-white"
          >
            डिजाइन तथा बिकास : अरुण कुमार साह
          </a>
        </div>
      </div>
    </footer>
  );
}
