// Geographic helpers. Kept dependency-free so both the check-in verification
// flow and any future "near me" sorting can share one implementation.

const EARTH_RADIUS_M = 6_371_000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two lat/lng points, in metres (haversine).
 * Returns `Infinity` if either coordinate is missing/invalid so callers can
 * fail safely (treat as "not at the restaurant") instead of mis-verifying.
 */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const lat1 = a?.latitude;
  const lon1 = a?.longitude;
  const lat2 = b?.latitude;
  const lon2 = b?.longitude;
  if (
    !Number.isFinite(lat1) || !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) || !Number.isFinite(lon2) ||
    (lat1 === 0 && lon1 === 0) || (lat2 === 0 && lon2 === 0)
  ) {
    return Infinity;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A check-in counts as "at the venue" within this radius (metres). */
export const CHECK_IN_RADIUS_M = 250;
