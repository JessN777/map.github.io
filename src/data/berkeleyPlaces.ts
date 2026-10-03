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

/** Default demo start for the Walk Together scenario. */
export const DEMO_START: KnownPlace = {
  label: 'Campus Dental Care',
  query: 'Campus Dental Care, Berkeley',
  // Campus Dental Care, 2433 Durant Ave
  coordinates: { lat: 37.86745, lng: -122.26015 },
}

/** Default demo destination for the Walk Together scenario. */
export const DEMO_DESTINATION: KnownPlace = {
  label: 'Artichokes Pizza',
  query: 'Artichokes Pizza',
  // Artichoke Basille's Pizza, 2375 Telegraph Ave
  coordinates: { lat: 37.8674, lng: -122.2589 },
}

export const PLACE_STILES_HALL: KnownPlace = {
  label: 'Stiles Hall',
  query: 'Stiles Hall, UC Berkeley',
  // Stiles Hall, 2400 Bancroft Way
  coordinates: { lat: 37.8688, lng: -122.2609 },
}

export const PLACE_UNIT_3: KnownPlace = {
  label: 'Unit 3, Berkeley',
  query: 'Unit 3, Berkeley',
  coordinates: { lat: 37.86755, lng: -122.25575 },
}

export const PLACE_TARGET: KnownPlace = {
  label: 'Target near UC Berkeley',
  query: 'Target near UC Berkeley',
  coordinates: { lat: 37.86975, lng: -122.26815 },
}

export const PLACE_RSF: KnownPlace = {
  label: 'RSF',
  query: 'RSF (Recreational Sports Facility)',
  coordinates: { lat: 37.8685, lng: -122.2629 },
}

export const PLACE_HEARST_MINING: KnownPlace = {
  label: 'Hearst Memorial Mining Building',
  query: 'Hearst Memorial Mining Building',
  coordinates: { lat: 37.8741, lng: -122.2573 },
}

export const PLACE_HAAS: KnownPlace = {
  label: 'Haas Pavilion',
  query: 'Haas Pavilion',
  coordinates: { lat: 37.8694, lng: -122.2622 },
}

export const PLACE_GRIMES: KnownPlace = {
  label: 'Grimes Engineering Center',
  query: 'Grimes Engineering Center',
  coordinates: { lat: 37.8737, lng: -122.2579 },
}

export const DEMO_BANCROFT: KnownPlace = {
  label: 'Bancroft Way near UC Berkeley',
  query: 'Bancroft Way near UC Berkeley',
  coordinates: { lat: 37.86885, lng: -122.25955 },
}

export function matchKnownPlace(input: string): KnownPlace | null {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return null

  if (
    normalized === DEMO_START.query.toLowerCase() ||
    normalized === DEMO_START.label.toLowerCase() ||
    normalized.includes('campus dental') ||
    (normalized.includes('dental') && normalized.includes('berkeley'))
  ) {
    return DEMO_START
  }

  if (
    normalized === DEMO_DESTINATION.query.toLowerCase() ||
    normalized === DEMO_DESTINATION.label.toLowerCase() ||
    normalized.includes('artichoke')
  ) {
    return DEMO_DESTINATION
  }

  if (
    normalized === PLACE_STILES_HALL.query.toLowerCase() ||
    normalized === PLACE_STILES_HALL.label.toLowerCase() ||
    normalized.includes('stiles')
  ) {
    return PLACE_STILES_HALL
  }

  if (
    normalized === PLACE_HAAS.query.toLowerCase() ||
    normalized.includes('haas')
  ) {
    return PLACE_HAAS
  }

  if (
    normalized === PLACE_GRIMES.query.toLowerCase() ||
    normalized.includes('grimes')
  ) {
    return PLACE_GRIMES
  }

  if (
    normalized === PLACE_UNIT_3.query.toLowerCase() ||
    normalized.includes('unit 3')
  ) {
    return PLACE_UNIT_3
  }

  if (
    normalized === PLACE_TARGET.query.toLowerCase() ||
    (normalized.includes('target') &&
      (normalized.includes('berkeley') || normalized === 'target'))
  ) {
    return PLACE_TARGET
  }

  if (
    normalized === PLACE_RSF.query.toLowerCase() ||
    normalized === PLACE_RSF.label.toLowerCase() ||
    normalized.includes('rsf') ||
    normalized.includes('recreational sports')
  ) {
    return PLACE_RSF
  }

  if (
    normalized === PLACE_HEARST_MINING.query.toLowerCase() ||
    (normalized.includes('hearst') && normalized.includes('mining'))
  ) {
    return PLACE_HEARST_MINING
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
