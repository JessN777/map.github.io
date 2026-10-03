import { distanceMeters, offsetLatLng } from '../routing/geo'
import type { LatLng } from '../routing/types'
import {
  CLUSTER_MERGE_RADIUS_METERS,
  labelForIncidentType,
  penaltyRadiusForCount,
  visualRadiusForSeverity,
  type Incident,
  type IncidentType,
} from './incidents'

export type IncidentCluster = {
  id: string
  latitude: number
  longitude: number
  locationLabel: string
  reportCount: number
  incidents: Incident[]
  primaryType: IncidentType
  primaryTypeLabel: string
  maxSeverity: number
  latestTimestamp: string
  description: string
  /** Tight routing penalty radius around the reported road point. */
  radiusMeters: number
  /** Small visual halo — never neighborhood-scale. */
  visualRadiusMeters: number
  /** 0–1 weight for safer-route scoring (grows with cluster size). */
  weight: number
  /** Short road tick for map context. */
  roadSegment: LatLng[]
}

function averagePoint(incidents: Incident[]): LatLng {
  const lat =
    incidents.reduce((sum, incident) => sum + incident.latitude, 0) /
    incidents.length
  const lng =
    incidents.reduce((sum, incident) => sum + incident.longitude, 0) /
    incidents.length
  return { lat, lng }
}

function pickPrimaryType(incidents: Incident[]): IncidentType {
  return [...incidents].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity
    return b.timestamp.localeCompare(a.timestamp)
  })[0].type
}

function buildRoadSegment(incidents: Incident[], center: LatLng): LatLng[] {
  const withHighlight = incidents.find((incident) => incident.roadHighlight)
  const highlight = withHighlight?.roadHighlight ?? {
    eastMeters: 22,
    northMeters: 0,
  }
  const halfEast = highlight.eastMeters / 2
  const halfNorth = highlight.northMeters / 2
  return [
    offsetLatLng(center, -halfNorth, -halfEast),
    offsetLatLng(center, halfNorth, halfEast),
  ]
}

function clusterWeight(reportCount: number, maxSeverity: number): number {
  const severityPart = Math.min(Math.max(maxSeverity / 5, 0.25), 1)
  const countPart = Math.min(0.25 + reportCount * 0.2, 1)
  return Math.min(1, severityPart * 0.55 + countPart * 0.45)
}

/**
 * Group nearby reports into localized road-level clusters.
 * Clusters stay geographically tight (tens of meters, not blocks).
 */
export function clusterIncidents(incidents: Incident[]): IncidentCluster[] {
  if (!incidents.length) return []

  const remaining = [...incidents].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  )
  const clusters: IncidentCluster[] = []

  while (remaining.length) {
    const seed = remaining.shift()!
    const group = [seed]

    for (let i = remaining.length - 1; i >= 0; i--) {
      const candidate = remaining[i]
      const nearSeed = distanceMeters(
        { lat: seed.latitude, lng: seed.longitude },
        { lat: candidate.latitude, lng: candidate.longitude },
      )
      const nearAny = group.some(
        (member) =>
          distanceMeters(
            { lat: member.latitude, lng: member.longitude },
            { lat: candidate.latitude, lng: candidate.longitude },
          ) <= CLUSTER_MERGE_RADIUS_METERS,
      )
      if (nearSeed <= CLUSTER_MERGE_RADIUS_METERS || nearAny) {
        group.push(candidate)
        remaining.splice(i, 1)
      }
    }

    const center = averagePoint(group)
    const primaryType = pickPrimaryType(group)
    const maxSeverity = Math.max(...group.map((incident) => incident.severity))
    const latest = [...group].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    )[0]
    const locationLabel =
      group.find((incident) => incident.locationLabel)?.locationLabel ??
      'Reported location'

    clusters.push({
      id: `cluster-${group.map((incident) => incident.id).sort().join('_')}`,
      latitude: center.lat,
      longitude: center.lng,
      locationLabel,
      reportCount: group.length,
      incidents: group,
      primaryType,
      primaryTypeLabel: labelForIncidentType(primaryType),
      maxSeverity,
      latestTimestamp: latest.timestamp,
      description: latest.description,
      radiusMeters: penaltyRadiusForCount(group.length),
      visualRadiusMeters: visualRadiusForSeverity(maxSeverity, group.length),
      weight: clusterWeight(group.length, maxSeverity),
      roadSegment: buildRoadSegment(group, center),
    })
  }

  return clusters
}
