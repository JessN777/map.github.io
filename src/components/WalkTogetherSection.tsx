import { formatSharedDistance } from '../walkTogether/matchWalkers'
import type { WalkMatch, WalkTogetherConnection } from '../walkTogether/types'

type WalkTogetherSectionProps = {
  matches: WalkMatch[]
  connection: WalkTogetherConnection | null
  onWalkTogether: (match: WalkMatch) => void
  onCancelConnection: () => void
}

export function WalkTogetherSection({
  matches,
  connection,
  onWalkTogether,
  onCancelConnection,
}: WalkTogetherSectionProps) {
  if (connection?.status === 'connected') {
    const person = connection.match.walker
    return (
      <section className="walk-together walk-together--connected">
        <p className="route-panel__stat-label">Walk Together</p>
        <h3 className="walk-together__title">
          You’re walking together with {person.displayName}
        </h3>
        <p className="walk-together__copy">
          Optional companion — your safer route is unchanged. Shared stretch is
          highlighted on the map (~{formatSharedDistance(connection.match.overlapMeters)}
          ).
        </p>
        <div className="walk-together__connected-card">
          <div>
            <strong>{person.displayName}</strong>
            <span>
              {person.startLabel} → {person.destinationLabel}
            </span>
            <span className="walk-together__area">
              Approx. area: {person.approxStartArea}
            </span>
          </div>
          <button
            type="button"
            className="route-panel__secondary walk-together__cancel"
            onClick={onCancelConnection}
          >
            End
          </button>
        </div>
        <p className="walk-together__proto">
          Prototype mock matching — not live users or real-time location.
        </p>
      </section>
    )
  }

  if (connection?.status === 'pending') {
    const person = connection.match.walker
    return (
      <section className="walk-together">
        <p className="route-panel__stat-label">Walk Together</p>
        <h3 className="walk-together__title">Request sent</h3>
        <p className="walk-together__copy">
          Waiting for {person.displayName} to respond… Your route stays the
          same.
        </p>
        <p className="walk-together__proto">Simulated request — demo only.</p>
      </section>
    )
  }

  return (
    <section className="walk-together">
      <p className="route-panel__stat-label">Optional</p>
      <h3 className="walk-together__title">People walking your way</h3>
      <p className="walk-together__copy">
        Someone is walking a similar route. Connecting does not change your
        safer path.
      </p>

      {matches.length === 0 ? (
        <p className="walk-together__empty">
          No overlapping walkers nearby for this demo route.
        </p>
      ) : (
        <ul className="walk-together__list">
          {matches.map((match) => (
            <li key={match.walker.id} className="walk-together__row">
              <div>
                <strong>{match.walker.displayName}</strong>
                <span>
                  {match.walker.startLabel} → {match.walker.destinationLabel}
                </span>
                <span className="walk-together__overlap">
                  {match.overlapSummary}
                </span>
                <span className="walk-together__area">
                  Leaving in {match.walker.leavingInMinutes} min · Approx.{' '}
                  {match.walker.approxStartArea}
                </span>
              </div>
              <button
                type="button"
                className="walk-together__cta"
                onClick={() => onWalkTogether(match)}
              >
                Walk Together
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="walk-together__proto">
        Prototype mock matching — female demo profiles only. Exact peer GPS is
        never shown.
      </p>
    </section>
  )
}
