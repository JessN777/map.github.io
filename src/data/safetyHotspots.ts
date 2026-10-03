import type { SafetyHotspot } from '../routing/types'
import {
  INCIDENT_HOTSPOT_RADIUS_METERS,
  labelForIncidentType,
  type Incident,
} from './incidents'

/**
 * Static placeholder hotspots (crime clusters, lighting gaps, etc.).
 * Incident reports are stored separately and can be converted via
 * `incidentsToHotspots` when routing starts using safety data.
 */
export const SAFETY_HOTSPOTS: SafetyHotspot[] = []

/** Convert local incident reports into router-ready hotspot records. */
export function incidentsToHotspots(incidents: Incident[]): SafetyHotspot[] {
  return incidents.map((incident) => ({
    id: incident.id,
    lat: incident.latitude,
    lng: incident.longitude,
    weight: Math.min(Math.max(incident.severity / 5, 0), 1),
    radiusMeters: INCIDENT_HOTSPOT_RADIUS_METERS,
    label: labelForIncidentType(incident.type),
  }))
}
