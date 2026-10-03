import { offsetLatLng } from './geo'
import {
  fetchWalkingAlternatives,
  fetchWalkingViaWaypoint,
  type WalkingRouteCandidate,
} from './providers/osrmProvider'
import {
  routeCost,
  scoreRouteAgainstHotspots,
} from './safetyScore'
import type {
  LatLng,
  RouteRequest,
  RouteResult,
  SafetyHotspot,
  SafetyRouteComparison,
} from './types'

function candidateKey(candidate: WalkingRouteCandidate): string {
  const mid = candidate.coordinates[Math.floor(candidate.coordinates.length / 2)]
  return [
    Math.round(candidate.distanceMeters),
    mid?.lat.toFixed(5),
    mid?.lng.toFixed(5),
  ].join(':')
}

function toRouteResult(
  candidate: WalkingRouteCandidate,
  provider: RouteResult['provider'],
  safetyPenalty: number,
): RouteResult {
  return {
    coordinates: candidate.coordinates,
    distanceMeters: candidate.distanceMeters,
    durationSeconds: candidate.durationSeconds,
    provider,
    safetyPenalty,
  }
}

/**
 * Build extra candidates that intentionally arc around hotspots the
 * shortest path touches. Keeps the demo robust when OSRM alternatives
 * alone are not diverse enough.
 */
async function fetchDetourCandidates(
  start: LatLng,
  end: LatLng,
  hotspots: SafetyHotspot[],
  shortest: WalkingRouteCandidate,
): Promise<WalkingRouteCandidate[]> {
  const shortestScore = scoreRouteAgainstHotspots(
    shortest.coordinates,
    hotspots,
  )
  if (!shortestScore.encounters.length) return []

  const detours: WalkingRouteCandidate[] = []
  const hitIds = new Set(shortestScore.encounters.map((e) => e.id))

  for (const hotspot of hotspots.filter((h) => hitIds.has(h.id))) {
    const radius = hotspot.radiusMeters ?? 200
    const center = { lat: hotspot.lat, lng: hotspot.lng }
    // Step outside the hotspot in cardinal directions.
    const ring = radius + 90
    const waypoints = [
      offsetLatLng(center, ring, 0),
      offsetLatLng(center, -ring, 0),
      offsetLatLng(center, 0, ring),
      offsetLatLng(center, 0, -ring),
      offsetLatLng(center, ring * 0.7, ring * 0.7),
      offsetLatLng(center, -ring * 0.7, -ring * 0.7),
    ]

    const results = await Promise.all(
      waypoints.map((waypoint, index) =>
        fetchWalkingViaWaypoint(
          start,
          waypoint,
          end,
          `detour-${hotspot.id}-${index}`,
        ),
      ),
    )
    for (const result of results) {
      if (result) detours.push(result)
    }
  }

  return detours
}

function buildExplanation(
  safestEncounters: ReturnType<typeof scoreRouteAgainstHotspots>['encounters'],
  shortestEncounters: ReturnType<typeof scoreRouteAgainstHotspots>['encounters'],
  diverged: boolean,
): { explanation: string; avoidedHotspots: SafetyRouteComparison['avoidedHotspots'] } {
  const avoided = shortestEncounters.filter(
    (shortHit) => !safestEncounters.some((safeHit) => safeHit.id === shortHit.id),
  )

  const avoidedHotspots = avoided.map((hit) => ({
    id: hit.id,
    label: hit.label?.trim() || 'reported safety hotspot',
  }))

  if (!diverged) {
    if (!shortestEncounters.length) {
      return {
        explanation:
          'Showing the walking route based on distance. No reported hotspots were near this path.',
        avoidedHotspots: [],
      }
    }
    return {
      explanation:
        'Safer and shortest options were similar based on reported incidents nearby.',
      avoidedHotspots,
    }
  }

  if (avoidedHotspots.length === 1) {
    const place = avoidedHotspots[0].label
    return {
      explanation: `Route adjusted to avoid reported safety hotspot on ${place}. This is a safer route based on reported incidents — not a guarantee of safety.`,
      avoidedHotspots,
    }
  }

  if (avoidedHotspots.length > 1) {
    const names = avoidedHotspots.map((h) => h.label).join(', ')
    return {
      explanation: `Route adjusted to avoid reported safety hotspots (${names}). This is a safer route based on reported incidents — not a guarantee of safety.`,
      avoidedHotspots,
    }
  }

  return {
    explanation:
      'Selected a route avoiding reported hotspots where possible. This is a safer route based on reported incidents — not a guarantee of safety.',
    avoidedHotspots,
  }
}

/**
 * Calculate a safer walking route by scoring provider candidates against
 * reported hotspots. The walking geometry still comes from OSRM (or a
 * future provider); safety selection is layered on top modularly.
 */
export async function findSafestRoute(
  request: RouteRequest,
): Promise<SafetyRouteComparison> {
  const { start, end, safetyWeight = 1, hotspots = [] } = request

  const baseCandidates = await fetchWalkingAlternatives(start, end)
  const shortestBase = [...baseCandidates].sort(
    (a, b) => a.distanceMeters - b.distanceMeters,
  )[0]

  const detours =
    hotspots.length > 0
      ? await fetchDetourCandidates(start, end, hotspots, shortestBase)
      : []

  const deduped = new Map<string, WalkingRouteCandidate>()
  for (const candidate of [...baseCandidates, ...detours]) {
    const key = candidateKey(candidate)
    const existing = deduped.get(key)
    if (!existing || candidate.distanceMeters < existing.distanceMeters) {
      deduped.set(key, candidate)
    }
  }

  const scored = [...deduped.values()].map((candidate) => {
    const safety = scoreRouteAgainstHotspots(candidate.coordinates, hotspots)
    const cost = routeCost(
      candidate.distanceMeters,
      safety.penalty,
      safetyWeight,
    )
    return { candidate, safety, cost }
  })

  const shortestScored = [...scored].sort(
    (a, b) => a.candidate.distanceMeters - b.candidate.distanceMeters,
  )[0]

  const safestScored = [...scored].sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost
    return a.candidate.distanceMeters - b.candidate.distanceMeters
  })[0]

  const shortest = toRouteResult(
    shortestScored.candidate,
    'osrm',
    shortestScored.safety.penalty,
  )
  const safest = toRouteResult(
    safestScored.candidate,
    hotspots.length ? 'safety-aware' : 'osrm',
    safestScored.safety.penalty,
  )

  const diverged =
    Math.abs(safest.distanceMeters - shortest.distanceMeters) > 25 ||
    safest.coordinates.length !== shortest.coordinates.length ||
    (safest.coordinates[0] &&
      shortest.coordinates[0] &&
      (Math.abs(safest.coordinates[Math.floor(safest.coordinates.length / 2)].lat -
        shortest.coordinates[Math.floor(shortest.coordinates.length / 2)].lat) >
        0.0003 ||
        Math.abs(
          safest.coordinates[Math.floor(safest.coordinates.length / 2)].lng -
            shortest.coordinates[Math.floor(shortest.coordinates.length / 2)]
              .lng,
        ) > 0.0003))

  const { explanation, avoidedHotspots } = buildExplanation(
    safestScored.safety.encounters,
    shortestScored.safety.encounters,
    diverged,
  )

  return {
    safest,
    shortest,
    diverged,
    explanation,
    avoidedHotspots,
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem ? `${hours} hr ${rem} min` : `${hours} hr`
}
