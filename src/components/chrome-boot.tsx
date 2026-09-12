import { useEffect, useState, type ReactNode } from "react";
import { FeaturesProvider } from "@/components/features-provider";
import { SiteProvider } from "@/components/site-provider";
import { ThemeProvider, ThemeVars } from "@/components/theme-provider";
import { DEFAULT_FEATURES, type FeatureFlags } from "@/lib/features";
import { DEFAULT_SITE } from "@/lib/site";
import { DEFAULT_THEME, fontHref, type ThemeSettings } from "@/lib/theme";

export function ChromeBoot({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FEATURES);

  useEffect(() => {
    void import("@/lib/theme")
      .then((m) => m.getThemeSettings())
      .then(setTheme)
      .catch(() => undefined);
    void import("@/lib/features")
      .then((m) => m.getFeatureFlags())
      .then(setFeatures)
      .catch(() => undefined);
    void import("@/lib/site")
      .then((m) => m.getSiteIdentity())
      .then((site) => {
        if (window.location.pathname !== "/") return;
        if (site.name) document.title = site.tagline ? `${site.name} — ${site.tagline}` : site.name;
      })
      .catch(() => undefined);
    void import("@/lib/seo")
      .then((m) => m.getSeoSettings())
      .then((seo) => {
        if (window.location.pathname !== "/") return;
        if (seo.title) document.title = seo.title;
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const href = fontHref(theme.font);
    let link = document.querySelector<HTMLLinkElement>('link[data-theme-font="1"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-theme-font", "1");
      document.head.appendChild(link);
    }
    link.href = href;
  }, [theme.font]);

  return (
    <ThemeProvider theme={theme}>
      <ThemeVars theme={theme} />
      <FeaturesProvider flags={features}>
        <SiteProvider initial={DEFAULT_SITE}>{children}</SiteProvider>
      </FeaturesProvider>
    </ThemeProvider>
  );
}
