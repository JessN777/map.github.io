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
  /** Street / area label for compact map cards (e.g. "Bancroft Way"). */
  locationLabel: string
  /** True for seeded prototype reports (not real crime data). */
  isDemo?: boolean
  /**
   * Optional short road-aligned segment (meters east/west & north/south)
   * used only for a tiny visual highlight on the map.
   */
  roadHighlight?: {
    eastMeters: number
    northMeters: number
  }
}

export const DEMO_REPORT_LOCATION = 'Bancroft Way near Telegraph Ave'

/** Merge reports within this distance into one localized cluster. */
export const CLUSTER_MERGE_RADIUS_METERS = 45

/** Routing: only penalize paths that pass this close to a report/cluster. */
export const INCIDENT_PENALTY_RADIUS_METERS = 38

const STORAGE_KEY = 'safewalk_incidents'
const DEMO_SEED_VERSION = 'demo-incidents-v2'

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

/**
 * Fictional/demo reports placed on walking roads around campus.
 * Not real crime statistics — prototype reference points only.
 */
export const DEMO_INCIDENTS: Incident[] = [
  // Cluster on Bancroft near Telegraph (3 reports → more prominent)
  {
    id: 'demo-bancroft-telegraph-1',
    type: 'catcalling_harassment',
    description:
      'Demo: catcalling reported while walking west on Bancroft near Telegraph.',
    latitude: 37.86892,
    longitude: -122.25895,
    timestamp: hoursAgo(6),
    severity: 3,
    locationLabel: 'Bancroft Way',
    isDemo: true,
    roadHighlight: { eastMeters: 28, northMeters: 0 },
  },
  {
    id: 'demo-bancroft-telegraph-2',
    type: 'catcalling_harassment',
    description:
      'Demo: second report of harassment on the same Bancroft block.',
    latitude: 37.8689,
    longitude: -122.2592,
    timestamp: hoursAgo(18),
    severity: 3,
    locationLabel: 'Bancroft Way',
    isDemo: true,
    roadHighlight: { eastMeters: 24, northMeters: 0 },
  },
  {
    id: 'demo-bancroft-telegraph-3',
    type: 'suspicious_activity',
    description:
      'Demo: someone following pedestrians along Bancroft near Telegraph.',
    latitude: 37.86894,
    longitude: -122.25945,
    timestamp: hoursAgo(30),
    severity: 2,
    locationLabel: 'Bancroft Way',
    isDemo: true,
    roadHighlight: { eastMeters: 22, northMeters: 0 },
  },
  // Other Bancroft segments
  {
    id: 'demo-bancroft-dana',
    type: 'poor_lighting',
    description: 'Demo: dark stretch of sidewalk on Bancroft near Dana St.',
    latitude: 37.86888,
    longitude: -122.26115,
    timestamp: hoursAgo(40),
    severity: 2,
    locationLabel: 'Bancroft Way',
    isDemo: true,
    roadHighlight: { eastMeters: 30, northMeters: 0 },
  },
  {
    id: 'demo-bancroft-fulton',
    type: 'unsafe_area',
    description: 'Demo: students flagged this Bancroft block near Fulton as uneasy after dark.',
    latitude: 37.86882,
    longitude: -122.26485,
    timestamp: hoursAgo(12),
    severity: 3,
    locationLabel: 'Bancroft Way',
    isDemo: true,
    roadHighlight: { eastMeters: 26, northMeters: 0 },
  },
  // Nearby streets
  {
    id: 'demo-telegraph-durant',
    type: 'catcalling_harassment',
    description: 'Demo: catcalling reported on Telegraph Ave near Durant.',
    latitude: 37.86755,
    longitude: -122.2589,
    timestamp: hoursAgo(9),
    severity: 3,
    locationLabel: 'Telegraph Avenue',
    isDemo: true,
    roadHighlight: { eastMeters: 0, northMeters: 26 },
  },
  {
    id: 'demo-durant-college',
    type: 'poor_lighting',
    description: 'Demo: poor street lighting on Durant Ave near College Ave.',
    latitude: 37.86725,
    longitude: -122.2548,
    timestamp: hoursAgo(22),
    severity: 2,
    locationLabel: 'Durant Avenue',
    isDemo: true,
    roadHighlight: { eastMeters: 28, northMeters: 0 },
  },
  {
    id: 'demo-college-bancroft',
    type: 'suspicious_activity',
    description: 'Demo: suspicious loitering reported on College Ave near Bancroft.',
    latitude: 37.86915,
    longitude: -122.25455,
    timestamp: hoursAgo(15),
    severity: 2,
    locationLabel: 'College Avenue',
    isDemo: true,
    roadHighlight: { eastMeters: 0, northMeters: 24 },
  },
  {
    id: 'demo-oxford-university',
    type: 'other',
    description: 'Demo: broken glass / debris making the sidewalk hard to use on Oxford.',
    latitude: 37.87105,
    longitude: -122.26625,
    timestamp: hoursAgo(28),
    severity: 2,
    locationLabel: 'Oxford Street',
    isDemo: true,
    roadHighlight: { eastMeters: 0, northMeters: 22 },
  },
  {
    id: 'demo-hearst-euclid',
    type: 'poor_lighting',
    description: 'Demo: poorly lit sidewalk on Hearst Ave near Euclid.',
    latitude: 37.87515,
    longitude: -122.2604,
    timestamp: hoursAgo(36),
    severity: 2,
    locationLabel: 'Hearst Avenue',
    isDemo: true,
    roadHighlight: { eastMeters: 26, northMeters: 0 },
  },
  {
    id: 'demo-shattuck-allston',
    type: 'unsafe_area',
    description: 'Demo: students felt unsafe crossing Shattuck near Allston late at night.',
    latitude: 37.87035,
    longitude: -122.26805,
    timestamp: hoursAgo(50),
    severity: 3,
    locationLabel: 'Shattuck Avenue',
    isDemo: true,
    roadHighlight: { eastMeters: 0, northMeters: 24 },
  },
  {
    id: 'demo-channing-telegraph',
    type: 'other',
    description: 'Demo: other safety concern — aggressive panhandling reported on Channing.',
    latitude: 37.86615,
    longitude: -122.25885,
    timestamp: hoursAgo(8),
    severity: 2,
    locationLabel: 'Channing Way',
    isDemo: true,
    roadHighlight: { eastMeters: 24, northMeters: 0 },
  },
]

export function severityForType(type: IncidentType): number {
  return INCIDENT_TYPES.find((entry) => entry.value === type)?.severity ?? 2
}

export function labelForIncidentType(type: IncidentType): string {
  return INCIDENT_TYPES.find((entry) => entry.value === type)?.label ?? type
}

/**
 * Visual safety-zone radius from severity (+ small bump for clustered reports).
 * Kept localized — not neighborhood-scale. Routing radii stay separate.
 */
export function visualRadiusForSeverity(
  severity: number,
  reportCount: number,
): number {
  let base = 42
  if (severity <= 2) base = 40
  else if (severity === 3) base = 62 // catcalling / moderate
  else if (severity === 4) base = 74
  else base = 88

  const clusterBump = Math.min(Math.max(reportCount - 1, 0) * 8, 18)
  return Math.min(base + clusterBump, 95)
}

/** Routing penalty radius — unchanged behavior, independent of visuals. */
export function penaltyRadiusForCount(reportCount: number): number {
  if (reportCount >= 4) return 55
  if (reportCount >= 2) return 45
  return INCIDENT_PENALTY_RADIUS_METERS
}

export function formatApproxReportTime(timestamp: string): string {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000),
  )
  if (minutes < 60) {
    return `Reported approximately ${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 48) {
    return `Reported approximately ${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.round(hours / 24)
  return `Reported approximately ${days} day${days === 1 ? '' : 's'} ago`
}

/** Keep seeded demo reports present; preserve user-submitted reports. */
export function ensureDemoIncidents(incidents: Incident[]): Incident[] {
  const byId = new Map(incidents.map((incident) => [incident.id, incident]))

  // Drop legacy single Bancroft bubble from earlier prototypes.
  byId.delete('demo-bancroft-way')

  for (const demo of DEMO_INCIDENTS) {
    byId.set(demo.id, demo)
  }

  const userReports = [...byId.values()].filter((incident) => !incident.isDemo)
  return [...DEMO_INCIDENTS, ...userReports]
}

export function loadIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const version = localStorage.getItem(`${STORAGE_KEY}_version`)
    if (!raw || version !== DEMO_SEED_VERSION) {
      const seeded = ensureDemoIncidents([])
      saveIncidents(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as Incident[]
    if (!Array.isArray(parsed)) return ensureDemoIncidents([])
    return ensureDemoIncidents(parsed)
  } catch {
    return ensureDemoIncidents([])
  }
}

export function saveIncidents(incidents: Incident[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents))
    localStorage.setItem(`${STORAGE_KEY}_version`, DEMO_SEED_VERSION)
  } catch {
    // Ignore quota / private-mode failures for the local demo store.
  }
}

export function createIncident(input: {
  type: IncidentType
  description: string
  latitude: number
  longitude: number
  locationLabel?: string
}): Incident {
  return {
    id: crypto.randomUUID(),
    type: input.type,
    description: input.description.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    timestamp: new Date().toISOString(),
    severity: severityForType(input.type),
    locationLabel: input.locationLabel?.trim() || 'Reported location',
    isDemo: false,
    roadHighlight: { eastMeters: 22, northMeters: 0 },
  }
}

export function shortLocationLabel(locationQuery: string): string {
  const normalized = locationQuery.trim()
  if (!normalized) return 'Reported location'
  if (/bancroft/i.test(normalized)) return 'Bancroft Way'
  if (/telegraph/i.test(normalized)) return 'Telegraph Avenue'
  if (/durant/i.test(normalized)) return 'Durant Avenue'
  if (/college/i.test(normalized)) return 'College Avenue'
  if (/shattuck/i.test(normalized)) return 'Shattuck Avenue'
  if (/hearst/i.test(normalized)) return 'Hearst Avenue'
  if (/oxford/i.test(normalized)) return 'Oxford Street'
  if (/channing/i.test(normalized)) return 'Channing Way'
  return normalized.length > 28 ? `${normalized.slice(0, 28)}…` : normalized
}
