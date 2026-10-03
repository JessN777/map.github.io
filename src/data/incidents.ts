export const INCIDENT_TYPES = [
  {
    value: 'catcalling_harassment',
    label: 'Catcalling / harassment',
    severity: 3,
  },
  {
    value: 'suspicious_activity',
    label: 'Suspicious activity',
    severity: 2,
  },
  {
    value: 'unsafe_area',
    label: 'Unsafe area',
    severity: 3,
  },
  {
    value: 'assault',
    label: 'Assault',
    severity: 5,
  },
  {
    value: 'poor_lighting',
    label: 'Poor lighting',
    severity: 2,
  },
  {
    value: 'other',
    label: 'Other',
    severity: 2,
  },
] as const

export type IncidentType = (typeof INCIDENT_TYPES)[number]['value']

export type Incident = {
  id: string
  type: IncidentType
  description: string
  latitude: number
  longitude: number
  timestamp: string
  /** Integer severity from 1 (low) to 5 (critical). */
  severity: number
}

export const DEMO_REPORT_LOCATION = 'Bancroft Way near UC Berkeley'

/** Default hotspot radius for a reported incident (meters). */
export const INCIDENT_HOTSPOT_RADIUS_METERS = 120

const STORAGE_KEY = 'safewalk_incidents'

export function severityForType(type: IncidentType): number {
  return INCIDENT_TYPES.find((entry) => entry.value === type)?.severity ?? 2
}

export function labelForIncidentType(type: IncidentType): string {
  return INCIDENT_TYPES.find((entry) => entry.value === type)?.label ?? type
}

export function loadIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Incident[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveIncidents(incidents: Incident[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents))
  } catch {
    // Ignore quota / private-mode failures for the local demo store.
  }
}

export function createIncident(input: {
  type: IncidentType
  description: string
  latitude: number
  longitude: number
}): Incident {
  return {
    id: crypto.randomUUID(),
    type: input.type,
    description: input.description.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    timestamp: new Date().toISOString(),
    severity: severityForType(input.type),
  }
}

/** Map severity (1–5) to a 0–1 hotspot weight for a future router. */
export function incidentToHotspotWeight(severity: number): number {
  return Math.min(1, Math.max(0.2, severity / 5))
}
