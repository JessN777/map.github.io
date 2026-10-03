import {
  DEMO_DESTINATION,
  PLACE_STILES_HALL,
  PLACE_UNIT_3,
} from './berkeleyPlaces'
import type { MockWalker } from '../walkTogether/types'

/**
 * Prototype mock walkers — all female names for this demo.
 * These are not real people or live locations.
 *
 * Maya (Stiles Hall → Artichokes Pizza) strongly overlaps the demo walk
 * Campus Dental Care → Artichokes Pizza and sends an incoming request.
 */
export const MOCK_WALKERS: MockWalker[] = [
  {
    id: 'walker-maya',
    displayName: 'Maya',
    startLabel: 'Stiles Hall',
    destinationLabel: 'Artichokes Pizza',
    leavingInMinutes: 4,
    approxStartArea: 'near Stiles Hall / Bancroft',
    approxRouteSamples: [
      PLACE_STILES_HALL.coordinates,
      { lat: 37.86878, lng: -122.26087 },
      { lat: 37.86862, lng: -122.26092 },
      { lat: 37.86843, lng: -122.26138 },
      { lat: 37.8676, lng: -122.26129 },
      { lat: 37.86693, lng: -122.26116 },
      { lat: 37.86671, lng: -122.26045 },
      { lat: 37.86682, lng: -122.25962 },
      { lat: 37.86692, lng: -122.25882 },
      DEMO_DESTINATION.coordinates,
    ],
  },
  {
    id: 'walker-sofia',
    displayName: 'Sofia',
    startLabel: 'Unit 3',
    destinationLabel: 'Target',
    leavingInMinutes: 8,
    approxStartArea: 'near Unit 3 / Durant',
    approxRouteSamples: [
      PLACE_UNIT_3.coordinates,
      { lat: 37.8672, lng: -122.2595 },
      { lat: 37.8668, lng: -122.2635 },
      { lat: 37.8685, lng: -122.2670 },
      { lat: 37.8698, lng: -122.2682 },
    ],
  },
  {
    id: 'walker-emma',
    displayName: 'Emma',
    startLabel: 'Sather Gate',
    destinationLabel: 'Downtown Berkeley BART',
    leavingInMinutes: 6,
    approxStartArea: 'near Sather Gate',
    approxRouteSamples: [
      { lat: 37.8702, lng: -122.2595 },
      { lat: 37.8695, lng: -122.2620 },
      { lat: 37.8690, lng: -122.2660 },
      { lat: 37.8700, lng: -122.2682 },
    ],
  },
  {
    id: 'walker-olivia',
    displayName: 'Olivia',
    startLabel: 'RSF',
    destinationLabel: 'Hearst Memorial Mining Building',
    leavingInMinutes: 12,
    approxStartArea: 'near RSF',
    approxRouteSamples: [
      { lat: 37.8685, lng: -122.2629 },
      { lat: 37.8695, lng: -122.2655 },
      { lat: 37.8720, lng: -122.2660 },
      { lat: 37.8745, lng: -122.2620 },
      { lat: 37.8741, lng: -122.2573 },
    ],
  },
  {
    id: 'walker-aisha',
    displayName: 'Aisha',
    startLabel: 'College Ave',
    destinationLabel: 'Downtown Berkeley',
    leavingInMinutes: 10,
    approxStartArea: 'near College & Bancroft',
    approxRouteSamples: [
      { lat: 37.8692, lng: -122.2546 },
      { lat: 37.8685, lng: -122.2580 },
      { lat: 37.8690, lng: -122.2620 },
      { lat: 37.8700, lng: -122.2680 },
    ],
  },
]
