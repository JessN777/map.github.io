/** Geographic coordinate in WGS84. */
export type LatLng = {
  lat: number
  lng: number
}

/**
 * A location that may later influence route cost (poor lighting, incident
 * clusters, student reports, etc.). Not applied in the initial prototype.
 */
export type SafetyHotspot = {
  id: string
  lat: number
  lng: number
  /** Relative severity in [0, 1]. */
  weight: number
  radiusMeters?: number
  label?: string
}

export type RouteRequest = {
  start: LatLng
  end: LatLng
  /**
   * How strongly to prefer safer segments over shorter ones.
   * 0 = shortest walking path; higher = more detour for safety.
   * Reserved for a future safety-aware router.
   */
  safetyWeight?: number
  /** Optional hotspots to avoid or penalize. */
  hotspots?: SafetyHotspot[]
}

export type RouteResult = {
  coordinates: LatLng[]
  distanceMeters: number
  durationSeconds: number
  /** Provider used for this result (useful when swapping backends). */
  provider: 'osrm' | 'safety-aware'
}
