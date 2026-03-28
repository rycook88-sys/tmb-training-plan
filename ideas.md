# TMB Training Plan — Design Brainstorm

## Context
A personal training dashboard for a 6'2", 226 lb athlete preparing for a 10-day hut-to-hut Tour du Mont Blanc starting July 26, 2026. The app needs to be motivating, functional, and feel like a personal command center — not a generic fitness app. It should track weight progress toward 205 lb, display the structured workout plan, show the TMB itinerary, and include foot mobility routines.

---

<response>
<text>

## Idea 1: "Alpine Command Center" — Topographic Brutalism

**Design Movement:** Swiss Brutalist Typography meets topographic cartography. Think military-grade expedition planning tools crossed with the clean precision of Swiss design.

**Core Principles:**
1. Information density without clutter — every pixel earns its place
2. Monochrome foundation with a single accent color (alpine orange/safety orange) for urgency and progress
3. Data-forward: numbers are the hero, not decorative elements
4. Terrain-inspired textures — contour lines, elevation gradients, rock grain

**Color Philosophy:** A near-black slate (#0F1419) base representing pre-dawn alpine starts. Warm stone gray (#8B8680) for secondary text. Safety orange (#FF6B35) as the sole accent — the color of trail markers, rescue gear, and summit flags. White (#F5F0EB) for primary text, like snow on dark rock.

**Layout Paradigm:** Asymmetric dashboard with a persistent left sidebar showing the countdown timer and weight tracker as a vertical "altitude gauge." Main content area uses a stacked card system with hard edges and no border-radius — like topo map legend boxes. The TMB itinerary runs as a horizontal elevation profile strip across the top.

**Signature Elements:**
1. Contour-line background patterns that subtly shift based on scroll position
2. A vertical "altitude gauge" weight tracker that visually descends from 226 to 205 like descending a mountain
3. Hard-edge cards with single-pixel borders — no rounded corners, no soft shadows

**Interaction Philosophy:** Clicks feel decisive — instant state changes with no bounce animations. Hover states reveal additional data layers, like peeling back a map overlay. Progress updates feel like checking off waypoints.

**Animation:** Minimal and purposeful. Number counters tick up/down mechanically. Progress bars fill with a linear, steady motion — no ease-in-out. Cards slide in from the left on page load, like pulling maps from a case.

**Typography System:** 
- Display: "Space Grotesk" — geometric, technical, expedition-grade
- Body: "IBM Plex Mono" — monospaced for that data-terminal feel
- Numbers/Stats: "Space Grotesk" at heavy weight with tabular figures

</text>
<probability>0.07</probability>
</response>

---

<response>
<text>

## Idea 2: "Summit Journal" — Warm Expedition Narrative

**Design Movement:** Editorial adventure magazine meets personal journal. Inspired by Patagonia catalogs, National Geographic expedition logs, and hand-drawn trail guides.

**Core Principles:**
1. Warmth and humanity — this is a personal journey, not a corporate dashboard
2. Photography and terrain imagery as emotional anchors
3. Serif typography for gravitas; the plan feels like a published expedition guide
4. Earthy, natural palette that evokes alpine meadows and granite

**Color Philosophy:** Warm parchment base (#FAF6F1) like aged journal paper. Deep forest green (#1B4332) as the primary text and accent — the color of pine forests in the Chamonix valley. Burnt sienna (#A0522D) for highlights and interactive elements — warm like a refuge fireplace. Charcoal (#2D2D2D) for body text.

**Layout Paradigm:** Single-column editorial scroll with full-width "chapter" sections. Each training day is a "journal entry" with a date stamp and handwritten-style annotations. The weight tracker is a large, central arc gauge — like an altimeter. The TMB itinerary is presented as a vertical timeline with elevation profile thumbnails for each day.

**Signature Elements:**
1. A large circular altimeter-style weight gauge as the hero element
2. Subtle paper texture overlay on the background
3. Hand-drawn style dividers and route illustrations between sections

**Interaction Philosophy:** Scrolling feels like turning pages in a journal. Completing a workout "stamps" it with a checkmark that has a slight ink-bleed animation. The experience is contemplative and personal, not gamified.

**Animation:** Gentle fade-ins on scroll. The altimeter needle sweeps smoothly when weight updates. Section transitions use a soft parallax effect. Nothing jarring — everything moves like turning a page.

**Typography System:**
- Display: "Playfair Display" — classic serif with editorial authority
- Body: "Source Sans 3" — clean, readable, pairs well with serif display
- Accent/Labels: "Caveat" — handwritten feel for personal annotations and dates

</text>
<probability>0.05</probability>
</response>

---

<response>
<text>

## Idea 3: "Dark Ridge" — Night-Mode Athletic Dashboard

**Design Movement:** High-performance sports analytics meets dark-mode SaaS dashboard. Inspired by Strava's data visualization, Whoop's recovery metrics, and COROS watch interfaces.

**Core Principles:**
1. Dark-first for reduced eye strain during early morning and late night planning sessions
2. Neon accent gradients for energy and motivation — this should feel like a performance tool
3. Card-based modular layout where each metric is its own "widget"
4. Animated data visualizations that make progress feel alive

**Color Philosophy:** True dark (#09090B) base — not gray, actual near-black. Cool slate (#1E293B) for card surfaces. A gradient accent from electric teal (#06B6D4) to alpine blue (#3B82F6) for progress indicators and CTAs — evoking glacial ice and clear mountain skies. Warm amber (#F59E0B) as a secondary accent for warnings and weight milestones.

**Layout Paradigm:** CSS Grid dashboard with draggable-feeling (but static) widget cards. Two-column on desktop, single-column on mobile. A persistent top bar shows the countdown clock and current weight as always-visible KPIs. The workout plan lives in expandable accordion cards. The TMB itinerary is a horizontal scrollable elevation chart.

**Signature Elements:**
1. Gradient progress rings for weight and training completion
2. A real-time countdown timer with days/hours/minutes to July 26
3. Glowing card borders on hover — subtle neon edge lighting effect

**Interaction Philosophy:** Everything feels responsive and alive. Cards have subtle scale-up on hover. Completing items triggers a satisfying pulse animation. The dashboard feels like a cockpit — every element is actionable.

**Animation:** Smooth spring animations on card interactions. Progress rings animate on load with a satisfying sweep. Numbers count up with easing. Subtle background gradient shifts on scroll to keep the page feeling dynamic.

**Typography System:**
- Display: "Inter" at 800 weight — clean, modern, athletic
- Body: "Inter" at 400 — consistent and highly readable on dark backgrounds
- Numbers/Stats: "JetBrains Mono" — monospaced for data alignment and that technical edge

</text>
<probability>0.04</probability>
</response>

---

## Selected Approach: Idea 1 — "Alpine Command Center" (Topographic Brutalism)

This is the strongest fit because:
1. The user is a serious, data-driven athlete who tracks HR zones, rep schemes, and body mechanics — he wants information, not decoration
2. The brutalist aesthetic avoids the "AI slop" trap of rounded corners, purple gradients, and generic fitness app vibes
3. The topographic/expedition theme directly connects to the TMB without being cheesy
4. The safety orange accent creates urgency and motivation without overwhelming
5. The altitude gauge weight tracker is a unique, thematically perfect way to visualize the 226→205 journey
