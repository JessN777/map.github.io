import { useEffect, useState } from 'react'
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
  type Incident,
  type IncidentType,
} from './data/incidents'
import { SAFETY_HOTSPOTS } from './data/safetyHotspots'
import { findSafestRoute, formatDistance, formatDuration } from './routing/findRoute'
import { geocodePlace } from './routing/geocode'
import type { LatLng } from './routing/types'
import './App.css'

function App() {
  const [startQuery, setStartQuery] = useState(DEMO_START.query)
  const [destinationQuery, setDestinationQuery] = useState(
    DEMO_DESTINATION.query,
  )
  const [start, setStart] = useState<LatLng | null>(DEMO_START.coordinates)
  const [end, setEnd] = useState<LatLng | null>(DEMO_DESTINATION.coordinates)
  const [route, setRoute] = useState<LatLng[]>([])
  const [summary, setSummary] = useState<{
    distance: string
    duration: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [incidents, setIncidents] = useState<Incident[]>(() => loadIncidents())
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [focusIncidentId, setFocusIncidentId] = useState<string | null>(null)

  async function resolveAndRoute(
    startText: string,
    endText: string,
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

      const result = await findSafestRoute({
        start: startPoint,
        end: endPoint,
        // Intentionally not using incident hotspots for routing yet.
        safetyWeight: 1,
        hotspots: SAFETY_HOTSPOTS,
      })
      if (signal?.cancelled) return

      setRoute(result.coordinates)
      setSummary({
        distance: formatDistance(result.distanceMeters),
        duration: formatDuration(result.durationSeconds),
      })
    } catch (err) {
      if (signal?.cancelled) return
      setRoute([])
      setSummary(null)
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
      })

      setIncidents((current) => {
        const next = [incident, ...current]
        saveIncidents(next)
        return next
      })
      setFocusIncidentId(incident.id)
      setReportOpen(false)
    } catch (err) {
      setReportError(
        err instanceof Error ? err.message : 'Could not save that report.',
      )
    } finally {
      setReportSubmitting(false)
    }
  }

  useEffect(() => {
    const signal = { cancelled: false }
    void resolveAndRoute(DEMO_START.query, DEMO_DESTINATION.query, signal)
    return () => {
      signal.cancelled = true
    }
    // Load the Unit 3 → Target demo route once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-shell">
      <RoutePanel
        startQuery={startQuery}
        destinationQuery={destinationQuery}
        onStartChange={setStartQuery}
        onDestinationChange={setDestinationQuery}
        onSubmit={() => {
          setFocusIncidentId(null)
          void resolveAndRoute(startQuery, destinationQuery)
        }}
        onReportClick={() => {
          setReportError(null)
          setReportOpen(true)
        }}
        loading={loading}
        error={error}
        summary={summary}
        incidentCount={incidents.length}
      />
      <main className="app-shell__map">
        <RouteMap
          start={start}
          end={end}
          route={route}
          incidents={incidents}
          focusIncidentId={focusIncidentId}
        />
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
