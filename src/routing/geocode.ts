import { matchKnownPlace } from '../data/berkeleyPlaces'
import type { LatLng } from './types'

type NominatimResult = {
  lat: string
  lon: string
  display_name: string
}

/**
 * Resolve a place name to coordinates. Known Berkeley demo places are
 * resolved instantly; everything else uses Nominatim (OpenStreetMap).
 */
export async function geocodePlace(query: string): Promise<LatLng> {
  const trimmed = query.trim()
  if (!trimmed) {
    throw new Error('Enter a location.')
  }

  const known = matchKnownPlace(trimmed)
  if (known) {
    return known.coordinates
  }

  const params = new URLSearchParams({
    q: trimmed.includes('Berkeley') ? trimmed : `${trimmed}, Berkeley, CA`,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
  })

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Could not look up that location. Try again.')
  }

  const results = (await response.json()) as NominatimResult[]
  if (!results.length) {
    throw new Error(`No match found for “${trimmed}”.`)
  }

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  }
}
