# Formatting Verification

All collapsible section headers are now visually consistent:

- TRAINING ANALYTICS — GARMIN DATA (10) - small uppercase mono, right-aligned metadata
- 11-DAY ITINERARY — JULY 25 TO AUGUST 4, 2026 (11) - image banner style (intentionally different)
- TMB ROUTE MAP (12) - small uppercase mono, right-aligned metadata, chevron
- ELEVATION PROFILE (13) - small uppercase mono, right-aligned metadata, chevron
- GEAR CHECKLIST — PACK WEIGHT TARGET: 12–16 LBS (14) - small uppercase mono, weight on right, chevron
- DAILY BUDGET & FOOD STOPS (15) - small uppercase mono, totals on right, chevron
- WEATHER AVERAGES (LATE JULY) (16) - small uppercase mono, subtitle on right, chevron
- TECHNIQUE VIDEO LIBRARY (17) - small uppercase mono, count on right, chevron
- FOOT MOBILITY — HIGH TRANSVERSE ARCH PROTOCOL (18) - small uppercase mono, chevron

All headers now use:
- text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono
- w-3.5 h-3.5 text-[var(--primary)] icons
- w-4 h-4 rotating chevrons with hover color change
- container py-6 section wrappers
- border border-border bg-card content blocks
