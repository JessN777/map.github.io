# SafeWalk Berkeley

Safety-focused walking navigation prototype for UC Berkeley students.

## Demo

- **Start:** Unit 3, Berkeley  
- **Destination:** Target near UC Berkeley  
- Interactive map with a walking route between the two

## Stack

- React + TypeScript (Vite)
- [react-leaflet](https://react-leaflet.js.org/) / OpenStreetMap tiles
- [OSRM](https://project-osrm.org/) public foot-routing API

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Project layout

- `src/components/` — map and route form UI
- `src/routing/` — geocoding + route fetching (`findSafestRoute` accepts future `hotspots` / `safetyWeight`)
- `src/data/safetyHotspots.ts` — empty placeholder for later safety data

Safety reporting is intentionally out of scope for this prototype.
