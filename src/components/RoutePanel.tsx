type RoutePanelProps = {
  startQuery: string
  destinationQuery: string
  onStartChange: (value: string) => void
  onDestinationChange: (value: string) => void
  onSubmit: () => void
  onReportClick: () => void
  loading: boolean
  error: string | null
  summary: { distance: string; duration: string } | null
  incidentCount: number
}

export function RoutePanel({
  startQuery,
  destinationQuery,
  onStartChange,
  onDestinationChange,
  onSubmit,
  onReportClick,
  loading,
  error,
  summary,
  incidentCount,
}: RoutePanelProps) {
  return (
    <aside className="route-panel">
      <header className="route-panel__header">
        <p className="route-panel__eyebrow">UC Berkeley</p>
        <h1 className="route-panel__title">SafeWalk</h1>
        <p className="route-panel__subtitle">
          Walking directions built for getting across campus after dark.
        </p>
      </header>

      <form
        className="route-panel__form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className="field">
          <span className="field__label">Starting location</span>
          <input
            className="field__input"
            type="text"
            name="start"
            value={startQuery}
            onChange={(event) => onStartChange(event.target.value)}
            placeholder="Unit 3, Berkeley"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field__label">Destination</span>
          <input
            className="field__input"
            type="text"
            name="destination"
            value={destinationQuery}
            onChange={(event) => onDestinationChange(event.target.value)}
            placeholder="Target near UC Berkeley"
            autoComplete="off"
          />
        </label>

        <button className="route-panel__cta" type="submit" disabled={loading}>
          {loading ? 'Finding route…' : 'Find Safest Route'}
        </button>
      </form>

      <button
        type="button"
        className="route-panel__secondary route-panel__report"
        onClick={onReportClick}
      >
        Report an Incident
      </button>

      {error && <p className="route-panel__error">{error}</p>}

      {summary && !error && (
        <div className="route-panel__summary">
          <div>
            <span className="route-panel__stat-label">Walk</span>
            <strong>{summary.distance}</strong>
          </div>
          <div>
            <span className="route-panel__stat-label">About</span>
            <strong>{summary.duration}</strong>
          </div>
        </div>
      )}

      {incidentCount > 0 && (
        <p className="route-panel__incident-count">
          {incidentCount} reported hotspot{incidentCount === 1 ? '' : 's'} on
          the map
        </p>
      )}

      <p className="route-panel__note">
        Demo: report on Bancroft Way to place a visible safety hotspot. Hotspots
        are not used for routing yet.
      </p>
    </aside>
  )
}
