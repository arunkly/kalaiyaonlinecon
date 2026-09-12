const BLOCKED = [
  // English
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bitch", "asshole", "bastard",
  "dick", "pussy", "slut", "whore", "cunt", "nigger", "nigga", "retard", "faggot",
  "blowjob", "handjob",
  // Hindi / Hinglish
  "madarchod", "madarcd", "behenchod", "bhenchod", "behenchod", "bhnchod",
  "chutiya", "chutia", "chutya", "bhosdike", "bhosdi", "bsdk", "bhadwe", "bhadwa",
  "randi", "randii", "haraami", "harami", "haramzada", "gaand", "gandu", "gaandu",
  "loda", "lode", "lawda", "lauda", "lund", "choot", "jhatu", "rakhail",
  "kamina", "kamine", "suar", "kutta",
  // Nepali (Devanagari + roman)
  "मुजी", "मूजी", "मुजि", "muji", "mujee",
  "राण्डी", "रांडी", "रंडी", "राँडी",
  "चुतिया", "चुतिया", "मादरचोद", "मादरचोद", "बहनचोद", "भेनचोद",
  "भोसडी", "भोस्डीके", "भोस्दीके", "साला", "साली", "पाजी", "बेस्या",
  "पुजी", "पुजी", "ठेग", "लाउडा", "लौडा", "गान्डु", "गांडु",
  "salae", "paji", "besya",
  // Bhojpuri
  "भोसड़ा", "भोसडा", "चमार", "चक्का", "हरामी", "हरामजादा", "रंडीबाज",
  "लौंडा", "लौन्डा", "गांड", "गाँड", "चूत", "चुत", "मदरचोद",
  "bhosda", "bhosada", "launda", "gaand", "randibaz", "haramjada",
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/\$/g, "s")
    .replace(/[^a-z\u0900-\u097F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findBadWord(text: string) {
  const raw = normalize(text);
  const packed = raw.replace(/\s/g, "");
  return BLOCKED.find((w) => {
    const needle = w.toLowerCase();
    return raw.includes(needle) || packed.includes(needle.replace(/\s/g, ""));
  }) ?? null;
}

export const CHAT_WARN =
  "चेतावनी: अंग्रेजी, हिन्दी, नेपाली वा भोजपुरी गाली पठाउन पाइँदैन। फेरि गरे तपाईंको खाता मेटिनेछ।";
