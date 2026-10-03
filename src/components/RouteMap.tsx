import { useEffect, useMemo, useRef } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { BERKELEY_CENTER } from '../data/berkeleyPlaces'
import { clusterIncidents, type IncidentCluster } from '../data/incidentClusters'
import { formatApproxReportTime, type Incident } from '../data/incidents'
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

const divergeIcon = L.divIcon({
  className: 'sw-marker sw-marker--diverge',
  html: '<span></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function incidentPinIcon(reportCount: number) {
  const size = reportCount >= 3 ? 22 : reportCount >= 2 ? 18 : 14
  return L.divIcon({
    className: `sw-incident-pin sw-incident-pin--n${Math.min(reportCount, 4)}`,
    html:
      reportCount > 1
        ? `<span class="sw-incident-pin__dot"></span><span class="sw-incident-pin__count">${reportCount}</span>`
        : '<span class="sw-incident-pin__dot"></span>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

type RouteMapProps = {
  start: LatLng | null
  end: LatLng | null
  safestRoute: LatLng[]
  shortestRoute: LatLng[]
  showShortestComparison: boolean
  incidents: Incident[]
  focusIncidentId?: string | null
  /** Privacy-blurred shared stretch with a matched walker (no exact peer pins). */
  walkOverlapRoute?: LatLng[]
  /** Coarse approximate peer route (not live GPS). */
  walkPeerRoute?: LatLng[]
  walkApproxAreaCenter?: LatLng | null
  /** Approximate point where shared walk ends / routes diverge. */
  walkDivergePoint?: LatLng | null
}

function routeFingerprint(points: LatLng[]): string {
  if (!points.length) return 'empty'
  const mid = points[Math.floor(points.length / 2)]
  const first = points[0]
  const last = points[points.length - 1]
  return [
    points.length,
    first.lat.toFixed(5),
    first.lng.toFixed(5),
    mid.lat.toFixed(5),
    mid.lng.toFixed(5),
    last.lat.toFixed(5),
    last.lng.toFixed(5),
  ].join('|')
}

/**
 * Fit the map to routes once when they change, then get out of the way.
 */
function MapViewportController({
  start,
  end,
  safestRoute,
  shortestRoute,
  showShortestComparison,
  walkOverlapRoute,
  focusPoint,
}: {
  start: LatLng | null
  end: LatLng | null
  safestRoute: LatLng[]
  shortestRoute: LatLng[]
  showShortestComparison: boolean
  walkOverlapRoute: LatLng[]
  focusPoint: LatLng | null
}) {
  const map = useMap()
  const userMovedRef = useRef(false)
  const lastFitKeyRef = useRef('')
  const lastFocusKeyRef = useRef<string | null>(null)

  useMapEvents({
    dragstart: () => {
      userMovedRef.current = true
    },
    zoomstart: () => {
      if (lastFitKeyRef.current) userMovedRef.current = true
    },
  })

  useEffect(() => {
    map.dragging.enable()
    map.scrollWheelZoom.enable()
    map.doubleClickZoom.enable()
    map.touchZoom.enable()
    map.boxZoom.enable()
    map.keyboard.enable()
  }, [map])

  useEffect(() => {
    if (focusPoint) {
      const focusKey = `${focusPoint.lat.toFixed(5)},${focusPoint.lng.toFixed(5)}`
      if (lastFocusKeyRef.current !== focusKey) {
        lastFocusKeyRef.current = focusKey
        userMovedRef.current = false
        map.flyTo([focusPoint.lat, focusPoint.lng], 17, {
          duration: 0.65,
        })
      }
      return
    }

    const fitKey = [
      routeFingerprint(safestRoute),
      showShortestComparison ? routeFingerprint(shortestRoute) : 'no-short',
      routeFingerprint(walkOverlapRoute),
      start ? `${start.lat.toFixed(5)},${start.lng.toFixed(5)}` : 'no-start',
      end ? `${end.lat.toFixed(5)},${end.lng.toFixed(5)}` : 'no-end',
    ].join('::')

    if (fitKey === lastFitKeyRef.current) return

    const saferChanged =
      !lastFitKeyRef.current ||
      !lastFitKeyRef.current.startsWith(routeFingerprint(safestRoute))

    if (userMovedRef.current && !saferChanged) {
      lastFitKeyRef.current = fitKey
      return
    }

    lastFitKeyRef.current = fitKey
    userMovedRef.current = false

    const points: LatLng[] = [...safestRoute]
    if (showShortestComparison) points.push(...shortestRoute)
    if (walkOverlapRoute.length) points.push(...walkOverlapRoute)
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
  }, [
    map,
    start,
    end,
    safestRoute,
    shortestRoute,
    showShortestComparison,
    walkOverlapRoute,
    focusPoint,
  ])

  return null
}

function HotspotInfoCard({ cluster }: { cluster: IncidentCluster }) {
  return (
    <div className="incident-card">
      <strong className="incident-card__type">{cluster.primaryTypeLabel}</strong>
      <span className="incident-card__location">{cluster.locationLabel}</span>
      <p className="incident-card__desc">{cluster.description}</p>
      <span className="incident-card__time">
        {formatApproxReportTime(cluster.latestTimestamp)}
      </span>
      <span className="incident-card__count">
        {cluster.reportCount} report{cluster.reportCount === 1 ? '' : 's'} nearby
      </span>
      {cluster.incidents.some((incident) => incident.isDemo) && (
        <span className="incident-card__demo">
          Fictional demo report — not real crime data
        </span>
      )}
    </div>
  )
}

export function RouteMap({
  start,
  end,
  safestRoute,
  shortestRoute,
  showShortestComparison,
  incidents,
  focusIncidentId = null,
  walkOverlapRoute = [],
  walkPeerRoute = [],
  walkApproxAreaCenter = null,
  walkDivergePoint = null,
}: RouteMapProps) {
  const clusters = useMemo(() => clusterIncidents(incidents), [incidents])

  const focusPoint = useMemo(() => {
    if (!focusIncidentId) return null
    const incident = incidents.find((entry) => entry.id === focusIncidentId)
    if (!incident) return null
    return { lat: incident.latitude, lng: incident.longitude }
  }, [focusIncidentId, incidents])

  return (
    <MapContainer
      center={[BERKELEY_CENTER.lat, BERKELEY_CENTER.lng]}
      zoom={14}
      className="route-map"
      scrollWheelZoom
      dragging
      doubleClickZoom
      touchZoom
      boxZoom
      keyboard
      zoomControl
      inertia
      worldCopyJump={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewportController
        start={start}
        end={end}
        safestRoute={safestRoute}
        shortestRoute={shortestRoute}
        showShortestComparison={showShortestComparison}
        walkOverlapRoute={walkOverlapRoute}
        focusPoint={focusPoint}
      />

      {clusters.map((cluster) => (
        <Circle
          key={`halo-${cluster.id}`}
          center={[cluster.latitude, cluster.longitude]}
          radius={cluster.visualRadiusMeters}
          pathOptions={{
            color: '#be123c',
            weight: 2,
            dashArray: '4 6',
            fillColor: '#e11d48',
            fillOpacity: 0.16 + Math.min(cluster.maxSeverity, 5) * 0.03,
            opacity: 0.85,
            className: 'safety-hotspot',
            interactive: true,
          }}
        >
          <Popup className="incident-popup" maxWidth={220} minWidth={180}>
            <HotspotInfoCard cluster={cluster} />
          </Popup>
        </Circle>
      ))}

      {clusters.map((cluster) =>
        cluster.roadSegment.length >= 2 ? (
          <Polyline
            key={`road-${cluster.id}`}
            positions={cluster.roadSegment.map(
              (p) => [p.lat, p.lng] as [number, number],
            )}
            pathOptions={{
              color: '#9f1239',
              weight: cluster.reportCount >= 3 ? 6 : 4,
              opacity: 0.55,
              lineCap: 'round',
              className: 'incident-road-tick',
              interactive: false,
            }}
          />
        ) : null,
      )}

      {showShortestComparison && shortestRoute.length > 1 && (
        <Polyline
          positions={shortestRoute.map(
            (p) => [p.lat, p.lng] as [number, number],
          )}
          pathOptions={{
            color: '#b42318',
            weight: 5,
            opacity: 0.55,
            dashArray: '10 10',
            lineJoin: 'round',
            lineCap: 'round',
            interactive: false,
          }}
        />
      )}

      {safestRoute.length > 1 && (
        <Polyline
          positions={safestRoute.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: '#0f6b3d',
            weight: 6,
            opacity: 0.92,
            lineJoin: 'round',
            lineCap: 'round',
            interactive: false,
          }}
        />
      )}

      {walkPeerRoute.length > 1 && (
        <Polyline
          positions={walkPeerRoute.map(
            (p) => [p.lat, p.lng] as [number, number],
          )}
          pathOptions={{
            color: '#64748b',
            weight: 4,
            opacity: 0.45,
            dashArray: '6 8',
            lineJoin: 'round',
            lineCap: 'round',
            interactive: false,
          }}
        />
      )}

      {walkOverlapRoute.length > 1 && (
        <Polyline
          positions={walkOverlapRoute.map(
            (p) => [p.lat, p.lng] as [number, number],
          )}
          pathOptions={{
            color: '#0e7490',
            weight: 12,
            opacity: 0.35,
            lineJoin: 'round',
            lineCap: 'round',
            className: 'walk-overlap-corridor',
            interactive: false,
          }}
        />
      )}

      {walkOverlapRoute.length > 1 && (
        <Polyline
          positions={walkOverlapRoute.map(
            (p) => [p.lat, p.lng] as [number, number],
          )}
          pathOptions={{
            color: '#0891b2',
            weight: 5,
            opacity: 0.9,
            dashArray: '2 10',
            lineJoin: 'round',
            lineCap: 'round',
            interactive: false,
          }}
        />
      )}

      {walkApproxAreaCenter && (
        <Circle
          center={[walkApproxAreaCenter.lat, walkApproxAreaCenter.lng]}
          radius={180}
          pathOptions={{
            color: '#0e7490',
            weight: 1,
            dashArray: '4 6',
            fillColor: '#22d3ee',
            fillOpacity: 0.12,
            className: 'walk-approx-area',
            interactive: false,
          }}
        />
      )}

      {walkDivergePoint && (
        <Marker
          position={[walkDivergePoint.lat, walkDivergePoint.lng]}
          icon={divergeIcon}
          draggable={false}
        >
          <Popup className="incident-popup" maxWidth={180}>
            <div className="incident-card">
              <strong className="incident-card__type">Routes separate</strong>
              <span className="incident-card__location">
                Approximate point where the shared stretch ends
              </span>
            </div>
          </Popup>
        </Marker>
      )}

      {start && (
        <Marker
          position={[start.lat, start.lng]}
          icon={startIcon}
          draggable={false}
        />
      )}
      {end && (
        <Marker
          position={[end.lat, end.lng]}
          icon={endIcon}
          draggable={false}
        />
      )}

      {clusters.map((cluster) => (
        <Marker
          key={`pin-${cluster.id}`}
          position={[cluster.latitude, cluster.longitude]}
          icon={incidentPinIcon(cluster.reportCount)}
          draggable={false}
        >
          <Popup className="incident-popup" maxWidth={220} minWidth={180}>
            <HotspotInfoCard cluster={cluster} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
