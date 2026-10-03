import type { LatLng } from '../routing/types'

/** Mock peer walker used only for the prototype matching demo. */
export type MockWalker = {
  id: string
  displayName: string
  /** Approximate starting area label (never an exact pin). */
  startLabel: string
  /** Destination label for display (matching uses route overlap, not this). */
  destinationLabel: string
  /** Minutes until this person plans to leave. */
  leavingInMinutes: number
  /**
   * Approximate area label only — never show an exact start pin for peers.
   * Example: "near Stiles Hall".
   */
  approxStartArea: string
  /**
   * Coarse sample of their intended walk for overlap checks.
   * Intentionally sparse / approximate — not a live GPS trail.
   */
  approxRouteSamples: LatLng[]
}

export type WalkMatchQuery = {
  route: LatLng[]
  /** How soon the current user wants to leave (0 = now). */
  leavingInMinutes?: number
  /** Max departure-time gap (minutes) to consider a match. */
  departureWindowMinutes?: number
  /**
   * Minimum fraction of the peer route that must lie near the user's
   * route (and vice versa enough to form a shared stretch).
   */
  minRouteOverlap?: number
  /** Minimum approximate shared path length in meters. */
  minOverlapMeters?: number
  /** Minimum share of the user's route that must overlap. */
  minUserCoverage?: number
}

export type WalkMatch = {
  walker: MockWalker
  /** Combined score in [0, 1]. */
  score: number
  routeOverlapRatio: number
  /** Fraction of the user's route length that overlaps the peer path. */
  userCoverage: number
  overlapMeters: number
  departureDeltaMinutes: number
  /** Privacy-blurred shared stretch derived from the user's route. */
  approxOverlapRoute: LatLng[]
  /** Coarse approximate peer route for map display (not live GPS). */
  approxPeerRoute: LatLng[]
  /** Where the shared stretch ends / routes begin to separate (approx). */
  divergePoint: LatLng | null
  /** UI copy for how much the paths share. */
  overlapSummary: string
}

export type WalkTogetherConnection = {
  match: WalkMatch
  connectedAt: string
  /** pending = we sent a request; connected = mock acceptance */
  status: 'pending' | 'connected'
}
