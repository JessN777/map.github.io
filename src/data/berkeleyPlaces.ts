import type { LatLng } from '../routing/types'

export type KnownPlace = {
  label: string
  query: string
  coordinates: LatLng
}

/** Campus-area landmarks used for the demo and as a geocode fallback. */
export const BERKELEY_CENTER: LatLng = {
  lat: 37.8719,
  lng: -122.2585,
}

export const DEMO_START: KnownPlace = {
  label: 'Unit 3, Berkeley',
  query: 'Unit 3, Berkeley',
  // UC Berkeley Unit 3 residence halls (2400 Durant Ave)
  coordinates: { lat: 37.86755, lng: -122.25575 },
}

export const DEMO_DESTINATION: KnownPlace = {
  label: 'Target near UC Berkeley',
  query: 'Target near UC Berkeley',
  // Target, 2190 Shattuck Ave, Berkeley
  coordinates: { lat: 37.86975, lng: -122.26815 },
}

export const DEMO_BANCROFT: KnownPlace = {
  label: 'Bancroft Way near UC Berkeley',
  query: 'Bancroft Way near UC Berkeley',
  // Bancroft Way along the south edge of campus (near Telegraph)
  coordinates: { lat: 37.86885, lng: -122.25955 },
}

export function matchKnownPlace(input: string): KnownPlace | null {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return null

  if (
    normalized === DEMO_START.query.toLowerCase() ||
    normalized === DEMO_START.label.toLowerCase() ||
    normalized.includes('unit 3')
  ) {
    return DEMO_START
  }

  if (
    normalized === DEMO_DESTINATION.query.toLowerCase() ||
    normalized === DEMO_DESTINATION.label.toLowerCase() ||
    (normalized.includes('target') && normalized.includes('berkeley')) ||
    normalized === 'target'
  ) {
    return DEMO_DESTINATION
  }

  if (
    normalized === DEMO_BANCROFT.query.toLowerCase() ||
    normalized === DEMO_BANCROFT.label.toLowerCase() ||
    normalized.includes('bancroft')
  ) {
    return DEMO_BANCROFT
  }

  return null
}
