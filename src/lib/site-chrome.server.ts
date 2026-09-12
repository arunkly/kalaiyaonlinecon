import { DEFAULT_FEATURES, readFeatureFlags, type FeatureFlags } from "@/lib/features";
import { DEFAULT_SEO, readSeoSettings, type SeoSettings } from "@/lib/seo";
import { DEFAULT_THEME, readThemeSettings, type ThemeSettings } from "@/lib/theme";

export type SiteChrome = {
  seo: SeoSettings;
  theme: ThemeSettings;
  features: FeatureFlags;
};

export async function loadSiteChrome(): Promise<SiteChrome> {
  try {
    const [seo, theme, features] = await Promise.all([
      readSeoSettings(),
      readThemeSettings(),
      readFeatureFlags(),
    ]);
    return { seo, theme, features };
  } catch {
    return { seo: DEFAULT_SEO, theme: DEFAULT_THEME, features: DEFAULT_FEATURES };
  }
}
