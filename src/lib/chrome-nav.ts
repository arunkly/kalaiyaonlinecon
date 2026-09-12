import type { FeatureFlags, FeatureKey } from "@/lib/features";

export const CHROME_MODULES = [
  { key: "home", label: "गृह", to: "/", feature: null },
  { key: "gallery", label: "ग्यालरी", to: "/gallery", feature: "gallery" },
  { key: "directory", label: "डाइरेक्ट्री", to: "/directory", feature: "directory" },
  { key: "blood", label: "रक्तदाता", to: "/blood", feature: "blood" },
  { key: "election", label: "निर्वाचन", to: "/election", feature: "election" },
  { key: "epaper", label: "ई-पेपर", to: "/epaper", feature: "epaper" },
  { key: "chat", label: "च्याट", to: "/chat", feature: "chat" },
  { key: "members", label: "दर्ता सदस्य", to: "/members", feature: "members" },
  { key: "market", label: "सेयर बजार", to: "/market", feature: "market" },
  { key: "patro", label: "पात्रो", to: "/patro", feature: "patro" },
  { key: "dateConverter", label: "मिति कन्भर्टर", to: "/date-converter", feature: "dateConverter" },
  { key: "preeti", label: "प्रीति कन्भर्टर", to: "/preeti", feature: "preeti" },
  { key: "about", label: "हाम्रोबारे", to: "/about", feature: "about" },
  { key: "privacy", label: "गोपनीयता", to: "/privacy", feature: "privacy" },
] as const;

export type ChromeKey = (typeof CHROME_MODULES)[number]["key"];

export const DEFAULT_BOTTOM_BAR: ChromeKey[] = ["home", "gallery", "directory", "election", "chat"];
export const DEFAULT_FOOTER_MENU: ChromeKey[] = [
  "home",
  "gallery",
  "directory",
  "blood",
  "election",
  "epaper",
  "members",
  "market",
  "patro",
  "dateConverter",
  "preeti",
  "about",
  "privacy",
];

const ALLOWED = new Set<string>(CHROME_MODULES.map((m) => m.key));

export function normalizeChromeKeys(raw: unknown, fallback: ChromeKey[]): ChromeKey[] {
  if (!Array.isArray(raw)) return fallback;
  const next = raw.map(String).filter((key): key is ChromeKey => ALLOWED.has(key));
  return next.length ? next : fallback;
}

export function chromeItems(keys: ChromeKey[], features: FeatureFlags) {
  const order = new Map(keys.map((key, i) => [key, i]));
  return CHROME_MODULES.filter((item) => {
    if (!order.has(item.key)) return false;
    if (item.feature && !features[item.feature as FeatureKey]) return false;
    return true;
  }).sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));
}
