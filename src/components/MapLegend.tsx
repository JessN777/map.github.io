export function MapLegend() {
  return (
    <div className="map-legend" aria-label="Map legend">
      <p className="map-legend__title">Map key</p>
      <ul className="map-legend__list">
        <li>
          <span className="map-legend__icon map-legend__icon--you" aria-hidden />
          Your location
        </li>
        <li>
          <span className="map-legend__icon map-legend__icon--route" aria-hidden />
          Your route
        </li>
        <li>
          <span className="map-legend__icon map-legend__icon--incident" aria-hidden />
          Reported incident
        </li>
        <li>
          <span className="map-legend__icon map-legend__icon--hotspot" aria-hidden />
          Safety hotspot
        </li>
      </ul>
    </div>
  )
}
