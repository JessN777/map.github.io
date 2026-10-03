import { WalkTogetherSection } from './WalkTogetherSection'
import type { WalkMatch, WalkTogetherConnection } from '../walkTogether/types'

type RouteSummary = {
  distance: string
  duration: string
}

type RoutePanelProps = {
  startQuery: string
  destinationQuery: string
  onStartChange: (value: string) => void
  onDestinationChange: (value: string) => void
  onSubmit: () => void
  onReportClick: () => void
  loading: boolean
  error: string | null
  safestSummary: RouteSummary | null
  explanation: string | null
  avoidedHotspotCount: number
  walkMatches: WalkMatch[]
  walkConnection: WalkTogetherConnection | null
  onWalkTogether: (match: WalkMatch) => void
  onCancelWalkTogether: () => void
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
  safestSummary,
  explanation,
  avoidedHotspotCount,
  walkMatches,
  walkConnection,
  onWalkTogether,
  onCancelWalkTogether,
}: RoutePanelProps) {
  return (
    <>
      <aside className="sheet sheet--top">
        <header className="sheet__header">
          <h1 className="sheet__title">SafeWalk Berkeley</h1>
          <p className="sheet__subtitle">Campus walking, with reported hotspots in mind</p>
        </header>

        <form
          className="route-panel__form"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <label className="field">
            <span className="field__label">From</span>
            <input
              className="field__input"
              type="text"
              name="start"
              value={startQuery}
              onChange={(event) => onStartChange(event.target.value)}
              placeholder="Campus Dental Care, Berkeley"
              autoComplete="off"
            />
          </label>

          <label className="field">
            <span className="field__label">To</span>
            <input
              className="field__input"
              type="text"
              name="destination"
              value={destinationQuery}
              onChange={(event) => onDestinationChange(event.target.value)}
              placeholder="Artichokes Pizza"
              autoComplete="off"
            />
          </label>

          <button className="route-panel__cta" type="submit" disabled={loading}>
            {loading ? 'Finding safer route…' : 'Find Safer Route'}
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
      </aside>

      {safestSummary && !error && (
        <aside className="sheet sheet--bottom">
          <div className="route-result">
            <p className="route-panel__stat-label">Navigation</p>
            <h2 className="route-result__title">Safer route found</h2>
            <p className="route-result__meta">
              {safestSummary.distance} · {safestSummary.duration}
            </p>
            <p className="route-result__avoid">
              {avoidedHotspotCount > 0
                ? `Avoiding ${avoidedHotspotCount} reported hotspot${
                    avoidedHotspotCount === 1 ? '' : 's'
                  }`
                : 'No hotspot detour needed on this path'}
            </p>
            {explanation && (
              <p className="route-result__explain">{explanation}</p>
            )}
          </div>

          <WalkTogetherSection
            matches={walkMatches}
            connection={walkConnection}
            onWalkTogether={onWalkTogether}
            onCancelConnection={onCancelWalkTogether}
          />

          <p className="route-panel__note">
            Demo data is fictional and not real campus crime statistics. Walk
            Together never changes your safer route.
          </p>
        </aside>
      )}
    </>
  )
}
