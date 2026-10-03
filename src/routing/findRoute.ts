import type { LatLng, RouteRequest, RouteResult } from './types'

type OsrmRouteResponse = {
  code: string
  routes?: Array<{
    distance: number
    duration: number
    geometry: {
      coordinates: [number, number][]
    }
  }>
}

/**
 * Fetch a walking route.
 *
 * Today this uses OSRM's public foot profile (shortest practical walk).
 * `safetyWeight` and `hotspots` are accepted so a future safety-aware
 * backend can plug in without changing the UI layer.
 */
export async function findSafestRoute(
  request: RouteRequest,
): Promise<RouteResult> {
  const { start, end, safetyWeight = 0, hotspots = [] } = request

  // Future: when hotspots / safetyWeight are provided, call a custom
  // router that penalizes risky segments instead of plain OSRM.
  if (hotspots.length > 0 && safetyWeight > 0) {
    // Reserved extension point — fall through to baseline walking route
    // until the safety model is implemented.
  }

  return fetchOsrmWalkingRoute(start, end)
}

async function fetchOsrmWalkingRoute(
  start: LatLng,
  end: LatLng,
): Promise<RouteResult> {
  const path = `${start.lng},${start.lat};${end.lng},${end.lat}`
  const url =
    `https://router.project-osrm.org/route/v1/foot/${path}` +
    '?overview=full&geometries=geojson'

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Routing service unavailable. Try again in a moment.')
  }

  const data = (await response.json()) as OsrmRouteResponse
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error('No walking route found between those places.')
  }

  const route = data.routes[0]
  const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({
    lat,
    lng,
  }))

  return {
    coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    provider: 'osrm',
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
