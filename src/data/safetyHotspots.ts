import type { SafetyHotspot } from '../routing/types'
import { clusterIncidents } from './incidentClusters'
import type { Incident } from './incidents'

/**
 * Static placeholder hotspots (unused — reports drive routing now).
 */
export const SAFETY_HOTSPOTS: SafetyHotspot[] = []

/**
 * Convert incident reports into tight, road-level hotspots for routing.
 * Nearby reports are clustered so repeated reports raise local penalty
 * without expanding across the neighborhood.
 */
export function incidentsToHotspots(incidents: Incident[]): SafetyHotspot[] {
  return clusterIncidents(incidents).map((cluster) => ({
    id: cluster.id,
    lat: cluster.latitude,
    lng: cluster.longitude,
    weight: cluster.weight,
    radiusMeters: cluster.radiusMeters,
    label: cluster.locationLabel,
  }))
}
