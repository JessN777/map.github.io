import type { LatLng } from '../types'

export type WalkingRouteCandidate = {
  coordinates: LatLng[]
  distanceMeters: number
  durationSeconds: number
  source: string
}

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

function toCandidate(
  route: NonNullable<OsrmRouteResponse['routes']>[number],
  source: string,
): WalkingRouteCandidate {
  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    source,
  }
}

/**
 * Baseline walking-route provider (OSRM public demo server).
 * Replace this module later with a production routing service.
 */
export async function fetchWalkingAlternatives(
  start: LatLng,
  end: LatLng,
): Promise<WalkingRouteCandidate[]> {
  const path = `${start.lng},${start.lat};${end.lng},${end.lat}`
  const url =
    `https://router.project-osrm.org/route/v1/foot/${path}` +
    '?overview=full&geometries=geojson&alternatives=true&continue_straight=false'

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Routing service unavailable. Try again in a moment.')
  }

  const data = (await response.json()) as OsrmRouteResponse
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No walking route found between those places.')
  }

  return data.routes.map((route, index) =>
    toCandidate(route, `osrm-alt-${index}`),
  )
}

/** Fetch a walking route forced through an intermediate waypoint. */
export async function fetchWalkingViaWaypoint(
  start: LatLng,
  waypoint: LatLng,
  end: LatLng,
  source: string,
): Promise<WalkingRouteCandidate | null> {
  const path =
    `${start.lng},${start.lat};` +
    `${waypoint.lng},${waypoint.lat};` +
    `${end.lng},${end.lat}`
  const url =
    `https://router.project-osrm.org/route/v1/foot/${path}` +
    '?overview=full&geometries=geojson'

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = (await response.json()) as OsrmRouteResponse
    if (data.code !== 'Ok' || !data.routes?.[0]) return null
    return toCandidate(data.routes[0], source)
  } catch {
    return null
  }
}
