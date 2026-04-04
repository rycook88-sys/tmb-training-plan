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
- [x] Fix getTodayKey() to use local date instead of UTC (timezone mismatch bug)
- [x] Add "Restore to Active" button on previous day entries to move them to current day

## Micronutrient Display Overhaul
- [x] Show only total amounts (no addition breakdowns like "118mg + 195mg + ...")
- [x] Add mini progress bars showing % DV for each micronutrient
- [x] Fix AI prompt to always return numeric mg/mcg values (never "Moderate", "High", etc.)
- [x] Add all important micronutrients at 0% if missing (Omega-3, Fiber, Manganese, Copper, etc.)
- [x] Color-code: green >=100%, yellow 50-99%, red <50%

## Daily Presets (Replace Add Vitamins)
- [x] Replace "Add Vitamins" button with "Daily Presets" button
- [x] Opens a modal with two preset lists: "Work Day" and "Off Day"
- [x] Each preset is editable — add/remove items
- [x] Can snap a photo to add items to a preset
- [x] One tap adds all checked items from a preset to today's log
- [x] Vitamins are included as default items in both presets

## Common Items Library
- [x] New "Common Items" button/section
- [x] Snap a photo to add a food to the library
- [x] Shows saved common items with checkboxes
- [x] Select multiple items and batch-post them to today's log
- [x] Persisted to localStorage

## Edit Food Entries
- [x] Tap a logged food entry to edit its name/details
- [x] AI re-analyzes macros/micros for the updated food
- [x] Optional clarification question popup if AI needs more info

## Micronutrient AI Consistency Fix
- [x] Fix AI schema: change from variable array to fixed object with all 29 nutrients required
- [x] Update AI prompt to emphasize ingredient-level nutrient analysis
- [x] Update frontend normalizeMicros to handle new fixed-object format
- [x] Test with "Mixed protein bowl with broccoli" to verify Vitamin K is always returned
