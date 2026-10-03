import { distanceMeters } from '../routing/geo'
import type { LatLng } from '../routing/types'
import { MOCK_WALKERS } from '../data/walkTogetherUsers'
import type { MockWalker, WalkMatch, WalkMatchQuery } from './types'

function nearestDistance(point: LatLng, route: LatLng[]): number {
  let best = Infinity
  for (const candidate of route) {
    const d = distanceMeters(point, candidate)
    if (d < best) best = d
    if (best === 0) break
  }
  return best
}

function routeLengthMeters(route: LatLng[]): number {
  let meters = 0
  for (let i = 1; i < route.length; i++) {
    meters += distanceMeters(route[i - 1], route[i])
  }
  return meters
}

/**
 * Symmetric route-overlap score in [0, 1]:
 * how much of each path lies near the other (not destination proximity).
 */
export function computeRouteOverlapRatio(
  userRoute: LatLng[],
  peerSamples: LatLng[],
  nearThresholdMeters = 110,
): number {
  if (!userRoute.length || !peerSamples.length) return 0

  const peerNearUser =
    peerSamples.filter(
      (sample) => nearestDistance(sample, userRoute) <= nearThresholdMeters,
    ).length / peerSamples.length

  const stride = Math.max(1, Math.floor(userRoute.length / 24))
  const userSamples = userRoute.filter((_, index) => index % stride === 0)
  const userNearPeer =
    userSamples.filter(
      (sample) => nearestDistance(sample, peerSamples) <= nearThresholdMeters,
    ).length / userSamples.length

  return (peerNearUser + userNearPeer) / 2
}

/** Estimate meters of the user's path that fall near the peer samples. */
export function estimateOverlapMeters(
  userRoute: LatLng[],
  peerSamples: LatLng[],
  nearThresholdMeters = 110,
): number {
  if (userRoute.length < 2 || !peerSamples.length) return 0

  let meters = 0
  for (let i = 1; i < userRoute.length; i++) {
    const prev = userRoute[i - 1]
    const cur = userRoute[i]
    const mid = {
      lat: (prev.lat + cur.lat) / 2,
      lng: (prev.lng + cur.lng) / 2,
    }
    if (nearestDistance(mid, peerSamples) <= nearThresholdMeters) {
      meters += distanceMeters(prev, cur)
    }
  }
  return meters
}

/**
 * Privacy-safe shared stretch taken from the user's route only
 * (never the peer's exact coordinates).
 */
export function buildApproxOverlapRoute(
  userRoute: LatLng[],
  peerSamples: LatLng[],
  nearThresholdMeters = 120,
): LatLng[] {
  if (userRoute.length < 2 || !peerSamples.length) return []

  const keepFlags = userRoute.map(
    (point) => nearestDistance(point, peerSamples) <= nearThresholdMeters,
  )

  const expanded = keepFlags.map((keep, index) => {
    if (keep) return true
    return Boolean(keepFlags[index - 1] || keepFlags[index + 1])
  })

  const overlap = userRoute.filter((_, index) => expanded[index])
  if (overlap.length < 2) return []

  const stride = Math.max(1, Math.floor(overlap.length / 20))
  return overlap.filter(
    (_, index) => index % stride === 0 || index === overlap.length - 1,
  )
}

/** Approximate point where the shared stretch ends. */
export function findDivergePoint(
  userRoute: LatLng[],
  overlapRoute: LatLng[],
): LatLng | null {
  if (!overlapRoute.length || userRoute.length < 2) return null
  const end = overlapRoute[overlapRoute.length - 1]
  // If overlap reaches near the destination, there is no meaningful split.
  const dest = userRoute[userRoute.length - 1]
  if (distanceMeters(end, dest) < 40) return null
  return end
}

/** Coarse, privacy-blurred peer path for map display. */
export function buildApproxPeerRoute(peerSamples: LatLng[]): LatLng[] {
  if (peerSamples.length <= 8) return [...peerSamples]
  const stride = Math.max(1, Math.floor(peerSamples.length / 8))
  return peerSamples.filter(
    (_, index) => index % stride === 0 || index === peerSamples.length - 1,
  )
}

export function formatSharedDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function overlapSummaryText(userCoverage: number): string {
  if (userCoverage >= 0.45) return 'Your routes overlap.'
  return 'Your routes overlap for part of the journey.'
}

function scoreMatch(input: {
  routeOverlapRatio: number
  userCoverage: number
  overlapMeters: number
  departureDeltaMinutes: number
  departureWindowMinutes: number
}): number {
  const departureScore = Math.max(
    0,
    1 - input.departureDeltaMinutes / input.departureWindowMinutes,
  )
  const lengthScore = Math.min(1, input.overlapMeters / 300)

  return (
    0.35 * input.routeOverlapRatio +
    0.35 * input.userCoverage +
    0.2 * lengthScore +
    0.1 * departureScore
  )
}

/**
 * Match walkers by meaningful route overlap + departure window.
 * Same destination alone is not enough — actual path overlap matters.
 *
 * Prototype only — not connected to real users or live location data.
 */
export function matchWalkers(
  query: WalkMatchQuery,
  candidates: MockWalker[] = MOCK_WALKERS,
): WalkMatch[] {
  const {
    route,
    leavingInMinutes = 0,
    departureWindowMinutes = 15,
    minRouteOverlap = 0.28,
    minOverlapMeters = 140,
    minUserCoverage = 0.32,
  } = query

  if (!route.length) return []

  const userLength = routeLengthMeters(route) || 1
  const matches: WalkMatch[] = []

  for (const walker of candidates) {
    const departureDeltaMinutes = Math.abs(
      walker.leavingInMinutes - leavingInMinutes,
    )
    if (departureDeltaMinutes > departureWindowMinutes) continue

    const routeOverlapRatio = computeRouteOverlapRatio(
      route,
      walker.approxRouteSamples,
    )
    const overlapMeters = estimateOverlapMeters(
      route,
      walker.approxRouteSamples,
    )
    const userCoverage = overlapMeters / userLength

    const strongByCoverage =
      userCoverage >= minUserCoverage && overlapMeters >= minOverlapMeters
    const strongBySamples =
      routeOverlapRatio >= minRouteOverlap && overlapMeters >= minOverlapMeters

    if (!strongByCoverage && !strongBySamples) continue

    const approxOverlapRoute = buildApproxOverlapRoute(
      route,
      walker.approxRouteSamples,
    )
    if (approxOverlapRoute.length < 2) continue

    matches.push({
      walker,
      score: scoreMatch({
        routeOverlapRatio,
        userCoverage,
        overlapMeters,
        departureDeltaMinutes,
        departureWindowMinutes,
      }),
      routeOverlapRatio,
      userCoverage,
      overlapMeters,
      departureDeltaMinutes,
      approxOverlapRoute,
      approxPeerRoute: buildApproxPeerRoute(walker.approxRouteSamples),
      divergePoint: findDivergePoint(route, approxOverlapRoute),
      overlapSummary: overlapSummaryText(userCoverage),
    })
  }

  return matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.walker.leavingInMinutes - b.walker.leavingInMinutes
  })
}
