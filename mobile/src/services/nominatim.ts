export interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    country?: string;
  };
}

export async function searchPlaces(query: string): Promise<NominatimResult[]> {
  if (!query || query.length < 3) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Quito, Ecuador")}&format=json&limit=5&addressdetails=1`;

  const res = await fetch(url, {
    headers: { "Accept-Language": "es", "User-Agent": "DatePlannerApp/1.0" },
  });

  const data = await res.json();
  return data;
}

export function formatAddress(result: NominatimResult): string {
  const parts = [
    result.address.road,
    result.address.suburb,
    result.address.city,
  ].filter(Boolean);
  return parts.join(", ") || result.display_name;
}
