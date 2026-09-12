import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const KALAIYA = { lat: 27.0386, lon: 85.0022, name: "कलैया" };

export const WMO_NP: Record<number, string> = {
  0: "सफा मौसम",
  1: "मुख्यतः सफा",
  2: "आंशिक बादल",
  3: "बादल",
  45: "तुवाँलो",
  48: "तुवाँलो",
  51: "हल्का झरी",
  53: "झरी",
  55: "बाक्लो झरी",
  61: "हल्का वर्षा",
  63: "वर्षा",
  65: "भारी वर्षा",
  71: "हल्का हिउँ",
  73: "हिउँ",
  75: "भारी हिउँ",
  80: "छिटपुट वर्षा",
  81: "वर्षा",
  82: "मूसलधारे",
  95: "चट्याङ",
  96: "असिनासहित चट्याङ",
  99: "असिनासहित चट्याङ",
};

export type WeatherNow = {
  place: string;
  lat: number;
  lon: number;
  temp: number;
  code: number;
  condition: string;
  wind: number;
  humidity?: number;
  source: "open-meteo";
};

const cache = new Map<string, { at: number; data: WeatherNow }>();

async function placeName(lat: number, lon: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ne`,
      { headers: { "User-Agent": "KalaiyaOnline/1.0 (https://www.kalaiyaonline.com)" } },
    );
    const json = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string; county?: string; state?: string };
    };
    const a = json.address ?? {};
    return a.city || a.town || a.village || a.county || a.state || "तपाईंको स्थान";
  } catch {
    return "तपाईंको स्थान";
  }
}

export const getWeather = createServerFn({ method: "GET" })
  .validator(
    z.object({
      lat: z.number().min(-90).max(90).optional(),
      lon: z.number().min(-180).max(180).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const lat = data.lat ?? KALAIYA.lat;
    const lon = data.lon ?? KALAIYA.lon;
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 10 * 60_000) return hit.data;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("मौसम API जडान भएन।");
    const json = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        relative_humidity_2m?: number;
      };
    };
    const nearKalaiya = Math.abs(lat - KALAIYA.lat) < 0.05 && Math.abs(lon - KALAIYA.lon) < 0.05;
    const place = nearKalaiya ? KALAIYA.name : await placeName(lat, lon);
    const code = json.current?.weather_code ?? 0;
    const row: WeatherNow = {
      place,
      lat,
      lon,
      temp: json.current?.temperature_2m ?? 0,
      code,
      condition: WMO_NP[code] || "मौसम",
      wind: json.current?.wind_speed_10m ?? 0,
      humidity: json.current?.relative_humidity_2m,
      source: "open-meteo",
    };
    cache.set(key, { at: Date.now(), data: row });
    return row;
  });
