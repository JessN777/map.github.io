import { useEffect, useRef, useState } from 'react'
import { MapLegend } from './components/MapLegend'
import { ReportIncidentForm } from './components/ReportIncidentForm'
import { RouteMap } from './components/RouteMap'
import { RoutePanel } from './components/RoutePanel'
import {
  DEMO_DESTINATION,
  DEMO_START,
} from './data/berkeleyPlaces'
import {
  createIncident,
  loadIncidents,
  saveIncidents,
  shortLocationLabel,
  type Incident,
  type IncidentType,
} from './data/incidents'
import { incidentsToHotspots } from './data/safetyHotspots'
import { findSafestRoute, formatDistance, formatDuration } from './routing/findRoute'
import { geocodePlace } from './routing/geocode'
import type { LatLng } from './routing/types'
import { matchWalkers } from './walkTogether/matchWalkers'
import type { WalkMatch, WalkTogetherConnection } from './walkTogether/types'
import './App.css'

type RouteSummary = {
  distance: string
  duration: string
}

function toSummary(distanceMeters: number, durationSeconds: number): RouteSummary {
  return {
    distance: formatDistance(distanceMeters),
    duration: formatDuration(durationSeconds),
  }
}

function App() {
  const [startQuery, setStartQuery] = useState(DEMO_START.query)
  const [destinationQuery, setDestinationQuery] = useState(
    DEMO_DESTINATION.query,
  )
  const [start, setStart] = useState<LatLng | null>(DEMO_START.coordinates)
  const [end, setEnd] = useState<LatLng | null>(DEMO_DESTINATION.coordinates)
  const [safestRoute, setSafestRoute] = useState<LatLng[]>([])
  const [shortestRoute, setShortestRoute] = useState<LatLng[]>([])
  const [safestSummary, setSafestSummary] = useState<RouteSummary | null>(null)
  const [showShortestComparison, setShowShortestComparison] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [avoidedHotspotCount, setAvoidedHotspotCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const initial = loadIncidents()
    saveIncidents(initial)
    return initial
  })
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [focusIncidentId, setFocusIncidentId] = useState<string | null>(null)

  const [walkMatches, setWalkMatches] = useState<WalkMatch[]>([])
  const [walkConnection, setWalkConnection] =
    useState<WalkTogetherConnection | null>(null)
  const acceptTimerRef = useRef<number | null>(null)

  function refreshWalkMatches(route: LatLng[]) {
    const matches = matchWalkers({
      route,
      leavingInMinutes: 0,
      departureWindowMinutes: 15,
      minRouteOverlap: 0.28,
      minOverlapMeters: 140,
      minUserCoverage: 0.32,
    })
    setWalkMatches(matches)
    // Clear companion state when the navigation route changes — never
    // recalculate the route because of Walk Together.
    setWalkConnection(null)
    if (acceptTimerRef.current) {
      window.clearTimeout(acceptTimerRef.current)
      acceptTimerRef.current = null
    }
  }

  async function resolveAndRoute(
    startText: string,
    endText: string,
    incidentList: Incident[],
    signal?: { cancelled: boolean },
  ) {
    setLoading(true)
    setError(null)

    try {
      const [startPoint, endPoint] = await Promise.all([
        geocodePlace(startText),
        geocodePlace(endText),
      ])
      if (signal?.cancelled) return

      setStart(startPoint)
      setEnd(endPoint)

      const comparison = await findSafestRoute({
        start: startPoint,
        end: endPoint,
        safetyWeight: 1.25,
        hotspots: incidentsToHotspots(incidentList),
      })
      if (signal?.cancelled) return

      setSafestRoute(comparison.safest.coordinates)
      setShortestRoute(comparison.shortest.coordinates)
      setSafestSummary(
        toSummary(
          comparison.safest.distanceMeters,
          comparison.safest.durationSeconds,
        ),
      )
      setShowShortestComparison(comparison.diverged)
      setExplanation(comparison.explanation)
      setAvoidedHotspotCount(comparison.avoidedHotspots.length)
      refreshWalkMatches(comparison.safest.coordinates)
    } catch (err) {
      if (signal?.cancelled) return
      setSafestRoute([])
      setShortestRoute([])
      setSafestSummary(null)
      setShowShortestComparison(false)
      setExplanation(null)
      setAvoidedHotspotCount(0)
      setWalkMatches([])
      setWalkConnection(null)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      if (!signal?.cancelled) setLoading(false)
    }
  }

  async function handleReportSubmit(input: {
    type: IncidentType
    description: string
    location: string
  }) {
    setReportSubmitting(true)
    setReportError(null)

    try {
      const coordinates = await geocodePlace(input.location)
      const incident = createIncident({
        type: input.type,
        description: input.description,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        locationLabel: shortLocationLabel(input.location),
      })

      const next = [incident, ...incidents]
      saveIncidents(next)
      setIncidents(next)
      setReportOpen(false)
      setFocusIncidentId(null)

      await resolveAndRoute(startQuery, destinationQuery, next)
    } catch (err) {
      setReportError(
        err instanceof Error ? err.message : 'Could not save that report.',
      )
    } finally {
      setReportSubmitting(false)
    }
  }

  function handleWalkTogether(match: WalkMatch) {
    // Social connection only — does not touch routing state.
    setWalkConnection({
      match,
      connectedAt: new Date().toISOString(),
      status: 'pending',
    })

    if (acceptTimerRef.current) {
      window.clearTimeout(acceptTimerRef.current)
    }
    acceptTimerRef.current = window.setTimeout(() => {
      setWalkConnection((current) =>
        current && current.match.walker.id === match.walker.id
          ? { ...current, status: 'connected' }
          : current,
      )
      acceptTimerRef.current = null
    }, 900)
  }

  useEffect(() => {
    const signal = { cancelled: false }
    void resolveAndRoute(
      DEMO_START.query,
      DEMO_DESTINATION.query,
      incidents,
      signal,
    )
    return () => {
      signal.cancelled = true
      if (acceptTimerRef.current) {
        window.clearTimeout(acceptTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connected = walkConnection?.status === 'connected'
  const walkOverlapRoute = connected
    ? (walkConnection?.match.approxOverlapRoute ?? [])
    : []
  const walkPeerRoute = connected
    ? (walkConnection?.match.approxPeerRoute ?? [])
    : []
  const walkApproxAreaCenter =
    walkOverlapRoute.length > 0
      ? walkOverlapRoute[Math.floor(walkOverlapRoute.length * 0.2)]
      : null
  const walkDivergePoint = connected
    ? (walkConnection?.match.divergePoint ?? null)
    : null

  return (
    <div className="app-shell">
      <RoutePanel
        startQuery={startQuery}
        destinationQuery={destinationQuery}
        onStartChange={setStartQuery}
        onDestinationChange={setDestinationQuery}
        onSubmit={() => {
          setFocusIncidentId(null)
          void resolveAndRoute(startQuery, destinationQuery, incidents)
        }}
        onReportClick={() => {
          setReportError(null)
          setReportOpen(true)
        }}
        loading={loading}
        error={error}
        safestSummary={safestSummary}
        explanation={explanation}
        avoidedHotspotCount={avoidedHotspotCount}
        walkMatches={walkMatches}
        walkConnection={walkConnection}
        onWalkTogether={handleWalkTogether}
        onCancelWalkTogether={() => {
          if (acceptTimerRef.current) {
            window.clearTimeout(acceptTimerRef.current)
            acceptTimerRef.current = null
          }
          setWalkConnection(null)
        }}
      />
      <main className="app-shell__map">
        <RouteMap
          start={start}
          end={end}
          safestRoute={safestRoute}
          shortestRoute={shortestRoute}
          showShortestComparison={showShortestComparison}
          incidents={incidents}
          focusIncidentId={focusIncidentId}
          walkOverlapRoute={walkOverlapRoute}
          walkPeerRoute={walkPeerRoute}
          walkApproxAreaCenter={walkApproxAreaCenter}
          walkDivergePoint={walkDivergePoint}
        />
        <MapLegend />
      </main>
      <ReportIncidentForm
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        submitting={reportSubmitting}
        error={reportError}
      />
    </div>
  )
}

export default App
