import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  Camera,
  Droplet,
  Home,
  Info,
  LineChart,
  Menu,
  MessageCircle,
  Newspaper,
  Search,
  Shield,
  Type,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { AdSlot } from "@/components/ad-slot";
import { AdPopup } from "@/components/ad-popup";
import { AppLogo } from "@/components/app-logo";
import { NoticeBell } from "@/components/notice-bell";
import { SiteFooter } from "@/components/site-footer";
import { MarketTicker } from "@/components/market-ticker";
import { NewsTicker } from "@/components/news-ticker";
import { WeatherBar } from "@/components/weather-bar";
import { getAboutPage, type AboutPage } from "@/lib/about";
import { cn } from "@/lib/cn";
import { chromeItems } from "@/lib/chrome-nav";
import { useCategories } from "@/lib/use-categories";
import { useFeatures } from "@/components/features-provider";
import { useSite } from "@/components/site-provider";
import { featureForPath } from "@/lib/features";

const NAV = [
  { to: "/", label: "गृह", icon: Home },
] as const;

const MORE_NAV = [
  { to: "/gallery", label: "ग्यालरी", icon: Camera, feature: "gallery" },
  { to: "/directory", label: "डाइरेक्ट्री", icon: Building2, feature: "directory" },
  { to: "/blood", label: "रक्तदाता", icon: Droplet, feature: "blood" },
  { to: "/election", label: "निर्वाचन", icon: Vote, feature: "election" },
  { to: "/chat", label: "च्याट", icon: MessageCircle, feature: "chat" },
] as const;

const BAR_ICONS: Record<string, typeof Home> = {
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

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const cats = useCategories();
  const features = useFeatures();
  const site = useSite();
  const moreNav = MORE_NAV.filter((item) => features[item.feature]);
  const navItems = [...NAV, ...moreNav];
  const bottomItems = chromeItems(site.bottomBar, features);
  const footerExtras = chromeItems(site.footerMenu, features).filter(
    (item) => !site.bottomBar.includes(item.key),
  );
  const [open, setOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [about, setAbout] = useState<AboutPage | null>(null);

  useEffect(() => {
    void getAboutPage()
      .then(setAbout)
      .catch(() => undefined);
  }, []);
  const [q, setQ] = useState("");

  useEffect(() => {
    setOpen(false);
    if (pathname.startsWith("/election/embed")) return;
    const key = featureForPath(pathname);
    if (key && features[key] === false) {
      void navigate({ to: "/" });
    }
  }, [pathname, features, navigate]);

  if (pathname.startsWith("/election/embed")) {
    return <div className="min-h-dvh bg-paper text-ink">{children}</div>;
  }

  return (
    <div className="min-h-dvh text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-crimson focus:px-3 focus:py-2 focus:text-paper"
      >
        समाचारमा जानुहोस्
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-3 py-2 sm:px-4">
          <Link to="/" className="shrink-0">
            <AppLogo className="h-8 w-auto sm:h-10" />
          </Link>

          <form
            action="/search"
            className="hidden min-w-0 flex-1 items-center md:flex"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) {
                void navigate({ to: "/search", search: { q: q.trim() } });
              }
            }}
          >
            <label className="sr-only" htmlFor="desk-search">
              खोज
            </label>
            <div className="flex w-full max-w-md items-center gap-2 rounded-full bg-[#f0f2f5] px-4 py-2">
              <Search className="size-4 shrink-0 text-muted" />
              <input
                id="desk-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={site.searchHint || `${site.name} खोज्नुहोस्`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
          </form>

          <nav className="hidden flex-1 justify-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "grid h-12 w-16 place-items-center rounded-lg",
                    active ? "text-crimson" : "text-muted hover:bg-chip",
                  )}
                >
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
          <Link
            to="/search"
            className="inline-flex size-10 items-center justify-center rounded-full bg-chip md:hidden"
            aria-label="खोज"
          >
            <Search className="size-5" />
          </Link>
          <NoticeBell />
          <AccountMenu />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-chip lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="मेनु"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          </div>
        </div>
        {features.market ? <MarketTicker /> : null}
        {features.weather ? <WeatherBar /> : null}
        {features.newsTicker ? <NewsTicker /> : null}
      </header>

      {open ? (
        <div className="border-b border-line bg-surface/95 backdrop-blur-sm lg:hidden">
          <nav className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip"
              >
                {item.label}
              </Link>
            ))}
            {cats.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="rounded-xl px-3 py-3 text-sm text-ink-soft hover:bg-chip"
              >
                {c.label}
              </Link>
            ))}
            {features.about ? (
            <Link to="/about" className="rounded-xl px-3 py-3 text-sm hover:bg-chip">
              हाम्रोबारे
            </Link>
            ) : null}
            {features.dateConverter ? (
            <Link to="/date-converter" className="rounded-xl px-3 py-3 text-sm hover:bg-chip">
              मिति कन्भर्टर
            </Link>
            ) : null}
            <Link to="/account" className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip">
              मेरो प्रोफाइल
            </Link>
            <Link to="/login" className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip">
              लगइन / लगआउट
            </Link>
          </nav>
        </div>
      ) : null}

      <main id="main" className="mx-auto w-full max-w-[1180px] px-3 pb-24 pt-4 sm:px-4 sm:pt-5 lg:pb-10">
        {children}
      </main>
      <AdSlot slot="footer" className="mx-auto max-w-6xl px-4 py-4 sm:px-6" />
      <SiteFooter about={about} />
      <AdPopup />

      <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-3 mb-[max(0.5rem,env(safe-area-inset-bottom))] rounded-2xl border border-line bg-white/95 shadow-[0_-8px_30px_rgb(16_38_26/0.12)] backdrop-blur-md">
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-crimson via-mark to-crimson" />
          <div className="flex px-1 py-1">
          {bottomItems.map((item) => {
            const Icon = BAR_ICONS[item.key] || Home;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to as "/"}
                className={cn(
                  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold",
                  active ? "text-crimson" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-full transition",
                    active ? "bg-crimson text-paper shadow-sm" : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setFooterOpen((v) => !v)}
            className={cn(
              "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold",
              footerOpen ? "text-crimson" : "text-muted",
            )}
            aria-label="मेनु"
          >
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full transition",
                footerOpen ? "bg-crimson text-paper shadow-sm" : "bg-transparent",
              )}
            >
              {footerOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </span>
            मेनु
          </button>
          </div>
        </div>
      </nav>
      {footerOpen ? (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-3 overflow-hidden rounded-2xl border border-line bg-white p-3 shadow-xl lg:hidden">
          <p className="px-1 pb-2 text-[11px] font-bold tracking-[0.16em] text-muted">मेनु</p>
          <div className="grid grid-cols-3 gap-2">
            {footerExtras.map((item) => {
              const Icon = BAR_ICONS[item.key] || Home;
              return (
                <Link
                  key={item.to}
                  to={item.to as "/"}
                  onClick={() => setFooterOpen(false)}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-chip px-2 py-3 text-center text-xs font-semibold"
                >
                  <Icon className="size-5 text-crimson" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
