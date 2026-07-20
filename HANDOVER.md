# TMB Training Plan — Portable Handover Guide

## Overview

This is a fully self-contained static web application. It requires **no backend server, no database, and no authentication system**. It builds to a `dist/` folder that can be deployed on any static hosting service.

---

## Quick Start (Local Development)

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open http://localhost:3000
```

---

## Production Build

```bash
# Build static files
pnpm build

# Preview the production build locally
pnpm preview
```

The output goes to the `dist/` folder. Upload that folder to any static host.

---

## Deployment Options

### Vercel (Recommended — Free Tier)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" → Import your repo
4. Framework Preset: **Vite**
5. Build Command: `pnpm build`
6. Output Directory: `dist`
7. Click Deploy

Vercel auto-deploys on every push to `main`.

### Netlify (Free Tier)

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Build Command: `pnpm build`
4. Publish Directory: `dist`
5. Deploy

### GitHub Pages (Free)

1. Push to GitHub
2. In repo Settings → Pages → Source: "GitHub Actions"
3. Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

### Any Static Host / VPS

Upload the contents of `dist/` to your web server's public directory. That's it.

For SPA routing (if you add routes later), configure your server to serve `index.html` for all 404s:
- **Nginx:** `try_files $uri $uri/ /index.html;`
- **Apache:** Add a `.htaccess` with `FallbackResource /index.html`

---

## Project Structure

```
tmb-training-plan/
├── client/
│   ├── public/
│   │   ├── images/          ← All images (local, no CDN)
│   │   ├── favicon.ico
│   │   ├── pwa-192x192.png
│   │   ├── pwa-512x512.png
│   │   └── sw.js
│   ├── src/
│   │   ├── components/      ← Reusable UI components
│   │   ├── contexts/        ← React contexts (theme, units)
│   │   ├── hooks/           ← Custom hooks
│   │   ├── lib/             ← Data files, utilities
│   │   │   ├── data.ts      ← TMB itinerary, workout plan
│   │   │   ├── travel-data.ts ← Flights, buses, hotels
│   │   │   ├── garmin-data.ts ← Garmin training data
│   │   │   ├── hooks.ts     ← Weight/workout localStorage hooks
│   │   │   └── seed-data/   ← Exported DB data (frozen)
│   │   ├── pages/
│   │   │   └── Home.tsx     ← Main app (single page)
│   │   ├── App.tsx          ← Router
│   │   ├── main.tsx         ← Entry point
│   │   └── index.css        ← Global styles + Tailwind
│   └── index.html
├── shared/                   ← Shared constants
├── vite.config.ts            ← Build config
├── package.json
├── tsconfig.json
└── HANDOVER.md               ← This file
```

---

## What Was Removed (vs. the Manus-hosted version)

| Feature | Status | Notes |
|---------|--------|-------|
| Manus OAuth | Removed | No login needed — single-user app |
| tRPC Server | Removed | All data is client-side |
| MySQL Database | Removed | Data exported to static JSON |
| AI Coach (Sierra) | Removed | Required Manus LLM API |
| Cloud Backup/Sync | Removed | localStorage only now |
| Garmin Upload | Removed | Required server processing |
| Nutrition Photo AI | Disabled | Required Manus LLM API |
| Data Export Page | Removed | No server to export from |

---

## What Still Works

- **Trail Mode:** Full TMB itinerary, elevation profiles, route map, daily stages, hut info
- **Travel Mode:** Confirmed flights (Delta), bus transfers (FlixBus), hotel bookings, gear checklist, daily budget, weather info, technique videos, travel toolkit
- **Training Mode (frozen):** Weight history chart, workout calendar, Garmin analytics, body fat estimator — all viewable but no new entries sync to cloud
- **Nutrition Tracker:** Still works via localStorage (manual entry only, photo AI disabled)
- **PWA:** Offline support, installable on phone
- **Theme switching:** Dark/light mode
- **Unit switching:** Metric/Imperial

---

## Data Storage

All user data (weight logs, workout sessions, nutrition entries) is stored in **browser localStorage**. This means:
- Data persists across page refreshes
- Data is specific to the browser/device
- Clearing browser data will erase it
- No cloud sync — what's on the device stays on the device

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Maps | Leaflet |
| Animations | Framer Motion |
| Icons | Lucide React |
| PWA | vite-plugin-pwa |
| Package Manager | pnpm |

---

## Troubleshooting

**"pnpm: command not found"**
```bash
npm install -g pnpm
```

**Build fails with memory error**
```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**Images not loading after deploy**
Make sure your hosting serves the `images/` folder from the root. All image paths start with `/images/...`.

**PWA not updating**
Hard refresh (Ctrl+Shift+R) or clear the service worker in DevTools → Application → Service Workers → Unregister.

---

## Customization

To update trip data (dates, flights, etc.), edit:
- `client/src/lib/travel-data.ts` — flights, buses, hotels
- `client/src/lib/data.ts` — TMB itinerary, workout plan, athlete profile

No build step needed for data changes during development — Vite hot-reloads automatically.
