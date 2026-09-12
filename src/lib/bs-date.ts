import calendar from "@/data/bs-calendar.json";
import { toNpDigits } from "@/data/articles";

export const BS_MONTHS = [
  "बैशाख",
  "जेठ",
  "असार",
  "साउन",
  "भदौ",
  "असोज",
  "कात्तिक",
  "मंसिर",
  "पुस",
  "माघ",
  "फागुन",
  "चैत",
];

type Cal = Record<string, number[]>;
const raw = calendar as Record<string, number[] | string>;
const days: Cal = {};
for (const [key, value] of Object.entries(raw)) {
  if (Array.isArray(value)) days[key] = value;
}

const AD_EPOCH = Date.UTC(1943, 3, 14);

function daysInBsYear(year: number) {
  return (days[String(year)] ?? []).reduce((a: number, b: number) => a + b, 0);
}

export function daysInBsMonth(year: number, month: number) {
  return days[String(year)]?.[month - 1] ?? 0;
}

export function availableBsYears() {
  return Object.keys(days)
    .map(Number)
    .sort((a, b) => a - b);
}

export function adToBs(iso: string) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  const utc = Date.UTC(y, m - 1, d);
  let remaining = Math.round((utc - AD_EPOCH) / 86400000);
  if (remaining < 0) return null;
  let year = 2000;
  while (days[String(year)] && remaining >= daysInBsYear(year)) {
    remaining -= daysInBsYear(year);
    year += 1;
  }
  const months = days[String(year)];
  if (!months) return null;
  let month = 1;
  for (const len of months) {
    if (remaining < len) {
      return { year, month, day: remaining + 1 };
    }
    remaining -= len;
    month += 1;
  }
  return null;
}

export function bsToAd(year: number, month: number, day: number) {
  const months = days[String(year)];
  if (!months || month < 1 || month > 12) return null;
  if (day < 1 || day > months[month - 1]) return null;
  let offset = 0;
  for (let y = 2000; y < year; y += 1) {
    if (!days[String(y)]) return null;
    offset += daysInBsYear(y);
  }
  for (let m = 0; m < month - 1; m += 1) offset += months[m];
  offset += day - 1;
  const dt = new Date(AD_EPOCH + offset * 86400000);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  };
}

export function formatBs(y: number, m: number, d: number) {
  return `${toNpDigits(d)} ${BS_MONTHS[m - 1]} ${toNpDigits(y)}`;
}

export function formatBsDate(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const ad = nepalAdIso(iso);
  if (!ad) return "";
  const bs = adToBs(ad);
  if (!bs) return "";
  return formatBs(bs.year, bs.month, bs.day);
}

export function formatBsDateTime(iso: string | Date | null | undefined) {
  return formatBsDate(iso);
}

function nepalAdIso(iso: string | Date) {
  const value = iso instanceof Date ? iso : new Date(iso);
  if (Number.isFinite(value.getTime())) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  }
  const sliced = String(iso).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(sliced) ? sliced : "";
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
