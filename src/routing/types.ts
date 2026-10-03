/** Geographic coordinate in WGS84. */
export type LatLng = {
  lat: number
  lng: number
}

/**
 * A location that may influence route cost (poor lighting, incident
 * clusters, student reports, etc.).
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
   * How strongly to prefer routes that avoid hotspots.
   * 0 = shortest walking path; higher = more detour for reported incidents.
   */
  safetyWeight?: number
  /** Optional hotspots to avoid or penalize. */
  hotspots?: SafetyHotspot[]
}

export type RouteResult = {
  coordinates: LatLng[]
  distanceMeters: number
  durationSeconds: number
  /** Provider / selection strategy used for this result. */
  provider: 'osrm' | 'safety-aware'
  /** Hotspot exposure score (0 = no reported-hotspot contact). */
  safetyPenalty?: number
}

export type AvoidedHotspotSummary = {
  id: string
  label: string
}

export type SafetyRouteComparison = {
  safest: RouteResult
  shortest: RouteResult
  /** True when the safer choice differs from the shortest path. */
  diverged: boolean
  /** Human-readable reason shown in the UI (non-absolute safety language). */
  explanation: string
  avoidedHotspots: AvoidedHotspotSummary[]
}
