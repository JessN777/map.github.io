import { distanceMeters } from './geo'
import type { LatLng, SafetyHotspot } from './types'

export type HotspotEncounter = {
  id: string
  label?: string
  /** Closest approach of the route to the hotspot center (meters). */
  minDistanceMeters: number
  /** Estimated meters of the path that fall inside the hotspot radius. */
  exposureMeters: number
  weight: number
}

export type RouteSafetyScore = {
  /** Unitless exposure score used in the cost function. */
  penalty: number
  encounters: HotspotEncounter[]
}

/**
 * Score how much a walking path intersects reported safety hotspots.
 *
 * Modular: swap this scorer (or call a real safety-aware API) without
 * changing the UI. Higher penalty => less preferred as a "safer" route.
 */
export function scoreRouteAgainstHotspots(
  coordinates: LatLng[],
  hotspots: SafetyHotspot[],
): RouteSafetyScore {
  if (!coordinates.length || !hotspots.length) {
    return { penalty: 0, encounters: [] }
  }

  const encounters: HotspotEncounter[] = []
  let penalty = 0

  for (const hotspot of hotspots) {
    const radius = hotspot.radiusMeters ?? 200
    const center = { lat: hotspot.lat, lng: hotspot.lng }
    let minDistance = Infinity
    let exposureMeters = 0

    for (let i = 0; i < coordinates.length; i++) {
      const point = coordinates[i]
      const d = distanceMeters(point, center)
      if (d < minDistance) minDistance = d

      if (i === 0) continue
      const prev = coordinates[i - 1]
      const segLen = distanceMeters(prev, point)
      const mid = {
        lat: (prev.lat + point.lat) / 2,
        lng: (prev.lng + point.lng) / 2,
      }
      const midDist = distanceMeters(mid, center)
      if (midDist < radius) {
        // Stronger penalty nearer the center.
        const proximity = 1 - midDist / radius
        exposureMeters += segLen * proximity
      }
    }

    if (minDistance < radius || exposureMeters > 0) {
      const weighted = hotspot.weight * exposureMeters
      penalty += weighted
      encounters.push({
        id: hotspot.id,
        label: hotspot.label,
        minDistanceMeters: minDistance,
        exposureMeters,
        weight: hotspot.weight,
      })
    }
  }

  return { penalty, encounters }
}

/**
 * Combine walking distance with hotspot exposure.
 * safetyWeight controls how willing we are to take a longer detour.
 */
export function routeCost(
  distanceMetersValue: number,
  penalty: number,
  safetyWeight: number,
): number {
  // Tight road-level radii mean less exposure length; amplify so avoiding
  // a reported segment still matters when a reasonable detour exists.
  const penaltyMeterEquivalent = 14
  return distanceMetersValue + safetyWeight * penalty * penaltyMeterEquivalent
}
