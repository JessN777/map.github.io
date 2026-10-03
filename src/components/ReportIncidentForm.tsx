import { useEffect, useState } from 'react'
import {
  DEMO_REPORT_LOCATION,
  INCIDENT_TYPES,
  type IncidentType,
} from '../data/incidents'

type ReportIncidentFormProps = {
  open: boolean
  onClose: () => void
  onSubmit: (input: {
    type: IncidentType
    description: string
    location: string
  }) => Promise<void>
  submitting: boolean
  error: string | null
}

export function ReportIncidentForm({
  open,
  onClose,
  onSubmit,
  submitting,
  error,
}: ReportIncidentFormProps) {
  const [type, setType] = useState<IncidentType>('unsafe_area')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(DEMO_REPORT_LOCATION)

  useEffect(() => {
    if (!open) return
    setType('unsafe_area')
    setDescription('')
    setLocation(DEMO_REPORT_LOCATION)
  }, [open])

  if (!open) return null

  return (
    <div className="report-modal" role="presentation" onClick={onClose}>
      <div
        className="report-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-incident-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="report-modal__header">
          <div>
            <p className="route-panel__eyebrow">Community safety</p>
            <h2 id="report-incident-title" className="report-modal__title">
              Report an Incident
            </h2>
          </div>
          <button
            type="button"
            className="report-modal__close"
            onClick={onClose}
            aria-label="Close report form"
          >
            ×
          </button>
        </header>

        <p className="report-modal__subtitle">
          Share what happened so other students can see nearby safety hotspots.
          Demo default: Bancroft Way.
        </p>

        <form
          className="route-panel__form"
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit({ type, description, location })
          }}
        >
          <label className="field">
            <span className="field__label">Incident type</span>
            <select
              className="field__input"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as IncidentType)}
            >
              {INCIDENT_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Description</span>
            <textarea
              className="field__input field__input--area"
              name="description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Briefly describe what happened or why the area feels unsafe."
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Location</span>
            <input
              className="field__input"
              type="text"
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bancroft Way near UC Berkeley"
              autoComplete="off"
              required
            />
          </label>

          {error && <p className="route-panel__error">{error}</p>}

          <div className="report-modal__actions">
            <button
              type="button"
              className="route-panel__secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="route-panel__cta report-modal__submit"
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
