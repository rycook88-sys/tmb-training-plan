# TMB Training Plan — Alpine Command Center

A personal training and trip planning app for a 10-day Tour du Mont Blanc hut-to-hut trek (109.5 miles). Built with React 19, Vite, and Tailwind CSS 4.

## Features

- **Trail Overview** — Interactive Leaflet map with GPS route, daily stage markers, elevation profile, water sources, and food stops
- **Travel Logistics** — Flight itinerary (Delta, 6 legs), confirmed FlixBus transfers (Geneva ↔ Chamonix), hotel bookings
- **Training Tracker** — Weight descent chart, workout logging with exercise sparklines, strength standards comparison (frozen/read-only)
- **Gear Checklist** — Categorized packing list with weight tracking and pack weight calculator
- **Weather** — Live Chamonix weather via Open-Meteo API
- **Daily Budget** — Per-day cost breakdown for the trek
- **Nutrition Tracker** — Calorie/macro logging with localStorage persistence
- **Offline Support** — PWA with service worker for offline access on the trail

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Maps | Leaflet + react-leaflet |
| Charts | Recharts |
| Animations | Framer Motion |
| Server | Express 5 (minimal static file server) |
| PWA | vite-plugin-pwa + Workbox |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Start production server
pnpm start
```

## Deployment

### Vercel (Recommended — Free)

1. Push this repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set framework preset to **Vite**
4. Build command: `pnpm build`
5. Output directory: `dist/public`
6. Deploy

### Netlify

1. Push to GitHub
2. Import on [netlify.com](https://netlify.com)
3. Build command: `pnpm build`
4. Publish directory: `dist/public`
5. Add a `_redirects` file in `client/public/` with: `/* /index.html 200`

### Self-hosted / Railway / Render

```bash
pnpm build
pnpm start
# Server listens on PORT env var (default 3000)
```

## Project Structure

```
├── client/
│   ├── public/
│   │   └── images/          ← All images (local, no CDN)
│   ├── src/
│   │   ├── components/      ← UI components (shadcn/ui + custom)
│   │   ├── contexts/        ← Theme and unit (mi/km) contexts
│   │   ├── hooks/           ← Custom React hooks
│   │   ├── lib/             ← Data files, utilities, seed data
│   │   ├── pages/           ← Page components (Home, NotFound)
│   │   ├── App.tsx          ← Router
│   │   ├── main.tsx         ← Entry point
│   │   └── index.css        ← Global styles + Tailwind theme
│   └── index.html           ← HTML template
├── server/
│   └── _core/
│       └── index.ts         ← Minimal Express server (static files + SPA fallback)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── HANDOVER.md              ← Detailed deployment & maintenance guide
```

## Data Sources

All trail/travel data is stored as static TypeScript/JSON files in `client/src/lib/`:

- `data.ts` — Athlete profile, TMB itinerary, workout plan, daily schedule
- `travel-data.ts` — Flights, buses, hotels, gear list, budget
- `tmb-trail-data.json` — GPS coordinates for the full TMB route
- `tmb_elevation_profile.json` — Elevation data for the profile chart
- `tmb-food-stops.ts` — Restaurant/food stop locations
- `tmb-water-sources.ts` — Water refill points along the trail
- `garmin-data.ts` — Historical training data (Garmin export)

## Environment Variables

None required. The app is fully self-contained. Weather data comes from the free Open-Meteo API (no key needed).

## License

MIT — Personal project.
