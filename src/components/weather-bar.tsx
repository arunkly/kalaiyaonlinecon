import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Wind } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { getWeather, KALAIYA, type WeatherNow } from "@/lib/weather";
import { toNpDigits } from "@/data/articles";

function weatherIcon(code: number): ComponentType<{ className?: string }> {
  if (code === 0 || code === 1) return Sun;
  if (code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 71 && code < 80) return CloudSnow;
  if (code >= 95) return CloudLightning;
  if (code >= 51) return CloudRain;
  return Wind;
}

export function WeatherBar() {
  const [data, setData] = useState<WeatherNow | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    function load(lat?: number, lon?: number) {
      void getWeather({ data: { lat, lon } })
        .then((row) => {
          if (alive) setData(row);
        })
        .catch(() => undefined);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(KALAIYA.lat, KALAIYA.lon),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
      );
    } else {
      load(KALAIYA.lat, KALAIYA.lon);
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let last = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      if (y > last && y > 48) setHidden(true);
      else setHidden(false);
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const Icon = data ? weatherIcon(data.code) : CloudSun;

  return (
    <div
      className={`overflow-hidden border-b border-[#2E7D32]/25 bg-[#E8F5E9] text-[#1b3d1f] transition-all duration-200 ${
        hidden ? "max-h-0 border-b-0" : "max-h-12"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-stretch">
        <span className="flex shrink-0 items-center gap-2 bg-[#2E7D32] px-3 py-2 text-[11px] font-semibold text-white">
          <span className="size-1.5 rounded-full bg-[#E87722]" />
          मौसम
        </span>
        <div className="min-w-0 flex-1 overflow-hidden px-3 py-2 text-sm">
          {data ? (
            <p className="flex min-w-0 items-center gap-2 truncate">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2E7D32]/10 text-[#2E7D32]">
                <Icon className="size-3.5" />
              </span>
              <span className="font-semibold text-[#2E7D32]">{data.place}</span>
              <span className="text-lg font-bold tabular-nums leading-none text-[#E87722]">
                {toNpDigits(Math.round(data.temp))}°
              </span>
              <span>{data.condition}</span>
              <span className="hidden text-[#2E7D32]/70 sm:inline">
                हावा {toNpDigits(Math.round(data.wind))} किमि/घण्टा
              </span>
              {data.humidity != null ? (
                <span className="hidden text-[#2E7D32]/70 md:inline">
                  आर्द्रता {toNpDigits(Math.round(data.humidity))}%
                </span>
              ) : null}
            </p>
          ) : (
            <p className="text-[#2E7D32]/70">मौसम लोड हुँदै…</p>
          )}
        </div>
      </div>
    </div>
  );
}
