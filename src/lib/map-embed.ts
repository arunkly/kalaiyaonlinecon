export type MapSettings = {
  provider: "osm" | "google";
  lat: number;
  lng: number;
  zoom: number;
  height: number;
};

export const DEFAULT_MAP: MapSettings = {
  provider: "osm",
  lat: 27.0336,
  lng: 85.0026,
  zoom: 15,
  height: 240,
};

export function parseCoords(raw?: string | null) {
  if (!raw) return null;
  const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function mapEmbedSrc(
  settings: MapSettings,
  point?: { lat?: number | null; lng?: number | null; mapUrl?: string; place?: string },
) {
  const parsed = parseCoords(point?.mapUrl);
  const lat = point?.lat || parsed?.lat || settings.lat;
  const lng = point?.lng || parsed?.lng || settings.lng;
  const zoom = Math.min(18, Math.max(8, settings.zoom || 15));
  if (point?.mapUrl?.includes("/embed") || point?.mapUrl?.includes("output=embed")) {
    return point.mapUrl;
  }
  if (settings.provider === "google") {
    const q = point?.mapUrl?.startsWith("http")
      ? point.mapUrl
      : `${lat},${lng}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;
  }
  const span = Math.max(0.004, 0.18 / zoom);
  const bbox = `${lng - span},${lat - span},${lng + span},${lat + span}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function mapOpenUrl(point?: { mapUrl?: string; lat?: number | null; lng?: number | null; place?: string }) {
  if (point?.mapUrl?.startsWith("http")) return point.mapUrl;
  if (point?.lat && point?.lng) {
    return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(point?.place || "Kalaiya, Bara")}`;
}
