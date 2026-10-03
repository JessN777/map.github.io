import { useEffect } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { BERKELEY_CENTER } from '../data/berkeleyPlaces'
import {
  INCIDENT_HOTSPOT_RADIUS_METERS,
  labelForIncidentType,
  type Incident,
} from '../data/incidents'
import type { LatLng } from '../routing/types'

// Fix default marker icons when bundling with Vite
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const startIcon = L.divIcon({
  className: 'sw-marker sw-marker--start',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const endIcon = L.divIcon({
  className: 'sw-marker sw-marker--end',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const incidentIcon = L.divIcon({
  className: 'sw-marker sw-marker--incident',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

type RouteMapProps = {
  start: LatLng | null
  end: LatLng | null
  route: LatLng[]
  incidents: Incident[]
  focusIncidentId?: string | null
}

function FitBounds({
  start,
  end,
  route,
  focusIncident,
}: {
  start: LatLng | null
  end: LatLng | null
  route: LatLng[]
  focusIncident: Incident | null
}) {
  const map = useMap()

  useEffect(() => {
    if (focusIncident) {
      map.flyTo([focusIncident.latitude, focusIncident.longitude], 16, {
        duration: 0.75,
      })
      return
    }

    const points: LatLng[] = [...route]
    if (start) points.push(start)
    if (end) points.push(end)

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 })
      return
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15)
    }
  }, [map, start, end, route, focusIncident])

  return null
}

function hotspotStyle(severity: number) {
  const intensity = Math.min(Math.max(severity, 1), 5) / 5
  return {
    color: '#b42318',
    weight: 2,
    dashArray: '6 6',
    fillColor: '#e11d48',
    fillOpacity: 0.14 + intensity * 0.18,
    opacity: 0.85,
    className: 'safety-hotspot',
  }
}

export function RouteMap({
  start,
  end,
  route,
  incidents,
  focusIncidentId = null,
}: RouteMapProps) {
  const focusIncident =
    incidents.find((incident) => incident.id === focusIncidentId) ?? null

  return (
    <MapContainer
      center={[BERKELEY_CENTER.lat, BERKELEY_CENTER.lng]}
      zoom={14}
      className="route-map"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds
        start={start}
        end={end}
        route={route}
        focusIncident={focusIncident}
      />

      {incidents.map((incident) => (
        <Circle
          key={`hotspot-${incident.id}`}
          center={[incident.latitude, incident.longitude]}
          radius={INCIDENT_HOTSPOT_RADIUS_METERS}
          pathOptions={hotspotStyle(incident.severity)}
        />
      ))}

      {route.length > 1 && (
        <Polyline
          positions={route.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: '#003262',
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round',
          }}
        />
      )}

      {start && (
        <Marker position={[start.lat, start.lng]} icon={startIcon} />
      )}
      {end && <Marker position={[end.lat, end.lng]} icon={endIcon} />}

      {incidents.map((incident) => (
        <Marker
          key={`marker-${incident.id}`}
          position={[incident.latitude, incident.longitude]}
          icon={incidentIcon}
        >
          <Popup>
            <strong>{labelForIncidentType(incident.type)}</strong>
            <br />
            {incident.description}
            <br />
            <small>
              Severity {incident.severity}/5 ·{' '}
              {new Date(incident.timestamp).toLocaleString()}
            </small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
