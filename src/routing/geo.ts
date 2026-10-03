import type { LatLng } from './types'

const EARTH_RADIUS_M = 6_371_000

/** Haversine distance in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Offset a point by north/east meters (local flat approximation). */
export function offsetLatLng(
  origin: LatLng,
  northMeters: number,
  eastMeters: number,
): LatLng {
  const dLat = northMeters / EARTH_RADIUS_M
  const dLng =
    eastMeters / (EARTH_RADIUS_M * Math.cos((origin.lat * Math.PI) / 180))
  return {
    lat: origin.lat + (dLat * 180) / Math.PI,
    lng: origin.lng + (dLng * 180) / Math.PI,
  }
}
