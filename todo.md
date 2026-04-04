# TODO: Nutrition Tracker Feature

## Phase 1: Upgrade & Architecture
- [x] Upgrade project to web-db-user (full-stack)
- [x] Plan data models: FoodEntry, DailyLog, VitaminConfig, RecommendationFeedback
- [x] Define macro targets: 2300 cal, 180g protein, calculate fat/carb split

## Phase 2: Backend API
- [x] POST /api/nutrition/analyze — accept photo, send to Forge vision API, return food name + macros + micros
- [x] POST /api/nutrition/confirm — accept confirmed food entry, return full macro/micro breakdown
- [x] GET /api/nutrition/daily — return today's totals (food + vitamins) (handled client-side via localStorage)
- [x] GET /api/nutrition/trends — return 3-day rolling trends + recommendations

## Phase 3: Frontend Component — NutritionTracker
- [x] Camera capture button (opens phone camera or file picker)
- [x] AI result display with editable food name field
- [x] Confirm button to lock in the food and get macros
- [x] Macro display: calories, protein, carbs, fat with progress bars (meal + daily total + remaining)
- [x] Micro nutrient dropdown (collapsible) showing % DV
- [x] Daily vitamin auto-add (Nature Made D3 + Vitafusion Multi) with combined totals
- [x] 3-day trend recommendations panel with thumbs up/down feedback buttons
- [x] Store all entries in localStorage (food log, vitamin log, feedback)
- [x] Wire into Home.tsx as a UtilityCard
- [x] Write vitest tests for nutrition router (analyzePhoto, reAnalyze, getTrends)

## Phase 4: Accommodation Elevation Fix
- [x] Convert accommodation elevation strings to numeric meters in TMBRouteMap
- [x] Format at render time using useUnits()

## Phase 5: Test & Deliver
- [x] Verify vitest tests pass (5/5)
- [ ] Verify camera works on mobile preview
- [ ] Verify AI food recognition returns reasonable results
- [ ] Verify macro progress bars update correctly
- [ ] Save checkpoint and deliver

## Bug Fixes
- [x] Fix Add Vitamins button closing out / finalizing the day — should only add vitamins to running totals
