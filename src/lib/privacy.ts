import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toNpDigits } from "@/data/articles";
import { DEFAULT_ABOUT, type AboutPage } from "@/lib/about";
import { assertCap } from "@/lib/admin-access";
import { authMiddleware } from "@/lib/auth/middleware";
import { formatBsDate } from "@/lib/bs-date";
import { FEATURE_CATALOG, DEFAULT_FEATURES, type FeatureFlags, type FeatureKey } from "@/lib/features";
import { DEFAULT_SEO } from "@/lib/seo";
import { DEFAULT_SITE, type SiteIdentity } from "@/lib/site";
import { publicOrigin } from "@/lib/site-url";

export type PrivacySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PrivacyStored = {
  intro: string;
  extra: string;
  fingerprint: string;
  updatedAt: string;
};

export type PrivacyDoc = {
  siteName: string;
  siteNameNp: string;
  host: string;
  origin: string;
  services: string[];
  autoIntro: string;
  intro: string;
  customIntro: string;
  extra: string;
  updatedAt: string;
  updatedLabel: string;
  sections: PrivacySection[];
  contact: { email: string; phone: string; address: string };
};

const DEFAULT_STORED: PrivacyStored = {
  intro: "",
  extra: "",
  fingerprint: "",
  updatedAt: "",
};

const SERVICE_KEYS: FeatureKey[] = [
  "gallery",
  "directory",
  "blood",
  "election",
  "epaper",
  "market",
  "weather",
  "patro",
  "dateConverter",
  "preeti",
  "chat",
  "members",
];

function text(value: unknown, fallback = "") {
  if (value == null) return fallback;
  return String(value).trim();
}

export function publicHost(raw: string | undefined | null) {
  const value = text(raw);
  try {
    const url = new URL(value.includes("://") ? value : `https://${value || "kalaiyaonline.com"}`);
    return url.hostname.replace(/^www\./, "") || "kalaiyaonline.com";
  } catch {
    return "kalaiyaonline.com";
  }
}

function joinNp(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} र ${items.at(-1)}`;
}

function sourceFingerprint(host: string, siteName: string, flags: FeatureFlags) {
  const on = FEATURE_CATALOG.filter((item) => flags[item.key]).map((item) => item.key).sort();
  return `${host}|${siteName}|${on.join(",")}`;
}

function serviceLabels(flags: FeatureFlags) {
  const names = ["समाचार"];
  for (const key of SERVICE_KEYS) {
    if (!flags[key]) continue;
    const item = FEATURE_CATALOG.find((row) => row.key === key);
    if (item) names.push(item.label);
  }
  return names;
}

function numbered(index: number, title: string) {
  return `${toNpDigits(index)}. ${title}`;
}

export function resolvePrivacyHost(
  about: Pick<AboutPage, "website">,
  canonical?: string,
  siteWebsite?: string,
) {
  return publicHost(about.website || siteWebsite || canonical || publicOrigin());
}

export function buildPrivacyDoc(opts: {
  site: SiteIdentity;
  flags: FeatureFlags;
  about: AboutPage;
  canonical?: string;
  stored?: PrivacyStored;
}): PrivacyDoc {
  const site = opts.site;
  const flags = opts.flags;
  const about = opts.about;
  const stored = opts.stored ?? DEFAULT_STORED;
  const host = resolvePrivacyHost(about, opts.canonical, opts.site.website);
  const origin = `https://${host}`;
  const services = serviceLabels(flags);
  const autoIntro = `${site.name} (“हामी”, “एप”, ${host}) ${site.tagline || "कलैया, बारा र मधेशका स्थानीय समाचार"} सञ्चालन गर्छ। हाल खुला सेवा: ${joinNp(services)}। यो नीति साइटको नाम, डोमेन र मोड्युल सेटिङअनुसार आफैं अद्यावधिक हुन्छ।`;
  const intro = stored.intro.trim() || autoIntro;
  const sections: PrivacySection[] = [];
  let n = 1;

  const collect: string[] = [
    "खाता: नाम, इमेल, पासवर्ड (एन्क्रिप्टेड), मोबाइल, ठेगाना, उमेर, भूमिका।",
    "समाचार गतिविधि: कमेन्ट, लाइक/डिसलाइक, सेभ, हेराइ गणना, सामाजिक सेयर।",
  ];
  if (flags.members) collect.push("प्रोफाइल: फोटो र सार्वजनिक प्रोफाइल विवरण।");
  if (flags.gallery) collect.push("ग्यालरी: हेराइ गणना; प्रशासकले राखेका तस्बिर।");
  if (flags.directory) collect.push("डाइरेक्ट्री: नाम, श्रेणी, फोन, इमेल, स्थान, तस्बिर।");
  if (flags.chat) collect.push("च्याट: साथी अनुरोध, सन्देश; अश्लील शब्द प्रयोगको चेतावनी लग प्रशासकलाई।");
  if (flags.blood) collect.push("रक्तदाता/आकस्मिक अनुरोध: नाम, रक्त समूह, फोन, स्थान, उमेर, फोटो।");
  if (flags.weather) {
    collect.push("मौसम: तपाईंले अनुमति दिएको जियोलोकेसन (अक्षांश/देशान्तर)। अनुमति नभए कलैयाको मौसम देखाइन्छ।");
  }
  if (flags.election) collect.push("निर्वाचन: उम्मेदवार विवरण, नतिजा हेराइ; क्षेत्र/पालिका चयन।");
  if (flags.epaper) collect.push("ई-पेपर: कुन मितिको पत्रिका हेरियो भन्ने हेराइ गणना।");
  if (flags.about) collect.push("सम्पर्क फारम: नाम, ठेगाना, इमेल, फोन, सन्देश।");
  collect.push("यन्त्रमा रहने कुरा: सेभ समाचार, टेक्स्ट साइज, सूचना बन्द सेटिङ (local storage)।");
  collect.push("लगइन सत्र कुकी / टोकनबाट चल्छ।");
  sections.push({ id: "collect", title: numbered(n, "हामी के संकलन गर्छौं"), bullets: collect });
  n += 1;

  const uses = [
    "खाता चिन्न, समाचार देखाउन, दुरुपयोग रोक्न, विज्ञापन राख्न र एप सुधार गर्न।",
  ];
  if (flags.gallery) uses.push("ग्यालरी देखाउन।");
  if (flags.directory) uses.push("स्थानीय डाइरेक्ट्री सञ्चालन गर्न।");
  if (flags.chat) uses.push("च्याट र साथी अनुरोध चलाउन।");
  if (flags.blood) uses.push("रक्तदाता जोड्न।");
  if (flags.weather) uses.push("मौसम देखाउन।");
  if (flags.market) uses.push("सेयर बजार टिकर देखाउन।");
  if (flags.election) uses.push("निर्वाचन नतिजा देखाउन।");
  if (flags.epaper) uses.push("ई-पेपर PDF देखाउन।");
  if (flags.patro || flags.dateConverter) uses.push("नेपाली पात्रो/मिति रूपान्तरण गर्न।");
  sections.push({
    id: "use",
    title: numbered(n, "किन प्रयोग गर्छौं"),
    paragraphs: [`${uses.join(" ")} हामी व्यक्तिगत डेटा तेस्रो पक्षलाई बेच्दैनौं।`],
  });
  n += 1;

  const seen: string[] = ["समाचार सार्वजनिक हुन सक्छन्।"];
  if (flags.gallery) seen.push("ग्यालरी सार्वजनिक हुन सक्छ।");
  if (flags.directory) seen.push("डाइरेक्ट्री सूची सार्वजनिक हुन सक्छ।");
  if (flags.market) seen.push("सेयर बजार सार्वजनिक हुन सक्छ।");
  if (flags.patro) seen.push("पात्रो सार्वजनिक हुन सक्छ।");
  if (flags.weather) seen.push("मौसम सार्वजनिक हुन सक्छ।");
  if (flags.blood) seen.push("रक्तदाता सूची सार्वजनिक हुन सक्छ।");
  if (flags.election) seen.push("निर्वाचन नतिजा सार्वजनिक हुन सक्छ।");
  if (flags.epaper) seen.push("ई-पेपर सार्वजनिक हुन सक्छ।");
  if (flags.members) seen.push("दर्ता सदस्य सूची र प्रोफाइल अन्य प्रयोगकर्ताले देख्न सक्छन्।");
  if (flags.chat) seen.push("च्याट सन्देश सम्बन्धित प्रयोगकर्ताले मात्र देख्छन्।");
  seen.push("प्रशासकले खाता, भूमिका, विज्ञापन, समाचार डेस्क र लग व्यवस्थापन गर्न सक्छ।");
  sections.push({ id: "who", title: numbered(n, "कसले देख्छ"), bullets: seen });
  n += 1;

  const third: string[] = [
    "लगइन र इमेल रिकभरी — प्रमाणीकरण सेवा।",
    "सामाजिक सेयर — Facebook, X, WhatsApp।",
    "होस्टिङ — वेब होस्ट र डाटाबेस प्रदायक (जस्तै Vercel, PostgreSQL)।",
    "विज्ञापन — प्रशासकले राखेको तस्बिर, पाठ वा HTML; बाह्य लिंक हुन सक्छ।",
  ];
  if (flags.weather) third.splice(1, 0, "मौसम — Open-Meteo र स्थान नामका लागि OpenStreetMap Nominatim।");
  if (flags.market) third.push("सेयर बजार — सार्वजनिक NEPSE/नेपाली पैसा स्रोत।");
  if (flags.election) third.push("निर्वाचन नक्सा — OpenStreetMap।");
  if (flags.epaper) third.push("ई-पेपर PDF — Google Drive पूर्वावलोकन।");
  sections.push({
    id: "third",
    title: numbered(n, "तेस्रो पक्ष सेवा"),
    bullets: third,
    paragraphs: ["ती सेवाको आफ्नै गोपनीयता नीति लागू हुन्छ।"],
  });
  n += 1;

  if (flags.weather) {
    sections.push({
      id: "weather",
      title: numbered(n, "स्थान र मौसम"),
      paragraphs: [
        "मौसम बारका लागि ब्राउजरले स्थान अनुमति माग्छ। अनुमति दिए अक्षांश/देशान्तर सर्भरमा पठाई तापक्रम निकालिन्छ; ठीक ठेगाना संकलन गरिँदैन। अनुमति अस्वीकार गरे कलैयाको मौसम देखिन्छ। यो अनुमति जुनसुकै बेला ब्राउजर सेटिङबाट फिर्ता लिन सकिन्छ।",
      ],
    });
    n += 1;
  }

  sections.push({
    id: "cookies",
    title: numbered(n, "कुकी र सूचना"),
    paragraphs: [
      "सत्र कायम राख्न कुकी प्रयोग हुन्छ। एपभित्र सूचना घण्टी र ब्राउजर सूचना अनुमति माग्न सकिन्छ। अनुमति बिना पुश पठाइँदैन।",
    ],
  });
  n += 1;

  if (flags.chat) {
    sections.push({
      id: "chat",
      title: numbered(n, "च्याट र दुरुपयोग"),
      paragraphs: [
        "अश्लील वा आपत्तिजनक शब्द (नेपाली, अंग्रेजी, हिन्दी, भोजपुरी) पठाए सन्देश रोकिन सक्छ र खाता हटाउने चेतावनी आउन सक्छ। त्यस्ता प्रयासको लग प्रशासकले हेर्न सक्छ।",
      ],
    });
    n += 1;
  }

  if (flags.epaper) {
    sections.push({
      id: "epaper",
      title: numbered(n, "ई-पेपर र Google Drive"),
      paragraphs: [
        "ई-पेपर PDF Google Drive मा होस्ट हुन्छ र पूर्वावलोकन iframe बाट देखाइन्छ। Drive को आफ्नै कुकी/नीति लागू हुन सक्छ। फाइल सेयर लिंक (anyone with the link) प्रशासकले राख्छ।",
      ],
    });
    n += 1;
  }

  sections.push({
    id: "rights",
    title: numbered(n, "तपाईंका अधिकार"),
    paragraphs: [
      "प्रोफाइल, फोटो, मोबाइल, ठेगाना र पासवर्ड अद्यावधिक गर्न सकिन्छ। खाता, कमेन्ट वा रक्तदाता रेकर्ड हटाउन प्रशासनलाई सम्पर्क गर्नुहोस्। पासवर्ड बिर्सिए रिकभरी इमेल प्रयोग गर्नुहोस्।",
    ],
  });
  n += 1;

  sections.push({
    id: "kids",
    title: numbered(n, "बालबालिका"),
    paragraphs: [
      "यो एप सामान्य पाठकका लागि हो। १६ वर्षमुनिका बालबालिकालाई अभिभावकको सहमतिबिना खाता नखोल्न अनुरोध छ।",
    ],
  });
  n += 1;

  sections.push({
    id: "changes",
    title: numbered(n, "नीति परिवर्तन"),
    paragraphs: [
      `साइटको नाम, डोमेन (${host}) वा मोड्युल अन/अफ गर्दा यो पृष्ठ आफैं अद्यावधिक हुन्छ। मिति माथिको “अन्तिम अद्यावधिक” मा हेर्नुहोस्।`,
    ],
  });
  n += 1;

  if (stored.extra.trim()) {
    sections.push({
      id: "extra",
      title: numbered(n, "अतिरिक्त जानकारी"),
      paragraphs: [stored.extra.trim()],
    });
    n += 1;
  }

  const contactBits = [
    about.email ? `इमेल ${about.email}` : "",
    about.phone ? `फोन ${about.phone}` : "",
    about.address || "",
  ].filter(Boolean);
  sections.push({
    id: "contact",
    title: numbered(n, "सम्पर्क"),
    paragraphs: [
      contactBits.length
        ? `नीतिबारे प्रश्न भए हाम्रोबारे पेज वा ${joinNp(contactBits)} मा लेख्नुहोस्।`
        : "नीतिबारे प्रश्न भए हाम्रोबारे पेजमा दिइएको फोन, इमेल वा ठेगानामा लेख्नुहोस्।",
    ],
  });

  const updatedAt = stored.updatedAt || new Date().toISOString();
  return {
    siteName: site.name,
    siteNameNp: site.nameNp,
    host,
    origin,
    services,
    autoIntro,
    intro,
    customIntro: stored.intro,
    extra: stored.extra,
    updatedAt,
    updatedLabel: formatBsDate(updatedAt) || formatBsDate(new Date()),
    sections,
    contact: {
      email: about.email,
      phone: about.phone,
      address: about.address,
    },
  };
}

async function ensureTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql`
    create table if not exists privacy_page (
      id integer primary key,
      intro text not null default '',
      extra text not null default '',
      fingerprint text not null default '',
      updated_at timestamptz not null default now()
    )
  `;
  return sql;
}

async function readStored(): Promise<PrivacyStored> {
  try {
    const sql = await ensureTable();
    const rows = await sql<{ intro: string; extra: string; fingerprint: string; updatedAt: string }>`
      select intro, extra, fingerprint, updated_at as "updatedAt"
      from privacy_page where id = 1 limit 1
    `;
    const row = rows[0];
    if (!row) return { ...DEFAULT_STORED };
    return {
      intro: text(row.intro),
      extra: text(row.extra),
      fingerprint: text(row.fingerprint),
      updatedAt: row.updatedAt ? String(row.updatedAt) : "",
    };
  } catch {
    return { ...DEFAULT_STORED };
  }
}

async function writeFingerprint(fingerprint: string) {
  try {
    const sql = await ensureTable();
    await sql`
      insert into privacy_page (id, intro, extra, fingerprint, updated_at)
      values (1, '', '', ${fingerprint}, now())
      on conflict (id) do update set
        fingerprint = excluded.fingerprint,
        updated_at = now()
    `;
  } catch {
    /* table may be unavailable */
  }
}

async function assembleDoc(): Promise<PrivacyDoc> {
  const { readSiteIdentity } = await import("@/lib/site");
  const { readFeatureFlags } = await import("@/lib/features");
  const { getAboutPage } = await import("@/lib/about");
  const { readSeoSettings } = await import("@/lib/seo");
  const [site, flags, about, seo, stored] = await Promise.all([
    readSiteIdentity().catch(() => DEFAULT_SITE),
    readFeatureFlags().catch(() => DEFAULT_FEATURES),
    getAboutPage().catch(() => DEFAULT_ABOUT),
    readSeoSettings().catch(() => DEFAULT_SEO),
    readStored(),
  ]);
  const nextFlags = flags;
  const fp = sourceFingerprint(resolvePrivacyHost(about, seo.canonicalUrl, site.website), site.name, nextFlags);
  let nextStored = stored;
  if (fp !== stored.fingerprint) {
    await writeFingerprint(fp);
    nextStored = { ...stored, fingerprint: fp, updatedAt: new Date().toISOString() };
  }
  if (!nextStored.updatedAt) nextStored = { ...nextStored, updatedAt: new Date().toISOString() };
  return buildPrivacyDoc({
    site,
    flags: nextFlags,
    about,
    canonical: seo.canonicalUrl,
    stored: nextStored,
  });
}

export const getPrivacyDoc = createServerFn({ method: "GET" }).handler(async () => assembleDoc());

export const savePrivacyPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      intro: z.string().max(2000).optional(),
      extra: z.string().max(8000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertCap(context.userId, "settings");
    const intro = text(data.intro).slice(0, 2000);
    const extra = text(data.extra).slice(0, 8000);
    const sql = await ensureTable();
    const { readSiteIdentity } = await import("@/lib/site");
    const { readFeatureFlags } = await import("@/lib/features");
    const { getAboutPage } = await import("@/lib/about");
    const { readSeoSettings } = await import("@/lib/seo");
    const [site, flags, about, seo] = await Promise.all([
      readSiteIdentity(),
      readFeatureFlags(),
      getAboutPage(),
      readSeoSettings(),
    ]);
    const fingerprint = sourceFingerprint(resolvePrivacyHost(about, seo.canonicalUrl, site.website), site.name, flags);
    await sql`
      insert into privacy_page (id, intro, extra, fingerprint, updated_at)
      values (1, ${intro}, ${extra}, ${fingerprint}, now())
      on conflict (id) do update set
        intro = excluded.intro,
        extra = excluded.extra,
        fingerprint = excluded.fingerprint,
        updated_at = now()
    `;
    return assembleDoc();
  });
