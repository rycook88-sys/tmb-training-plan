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

## Nutrition Tracker UI Overhaul v2
- [x] Remove standalone vitamin button (user will add vitamins via daily presets instead)
- [x] Add vitamins (Nature Made D3 + Vitafusion Multi) as default items in daily presets
- [x] Food detail popup: tap a food entry to see full info (macros, micros) in a modal/popup
- [x] Food detail popup: only show micros with >0% DV (skip zeros)
- [x] Food detail popup: styled like the vitamin detail cards
- [x] Food detail popup: tap outside to close
- [x] Edit window: bigger/taller input so user can see full food name
- [x] Edit window: each food item from same photo on separate lines (line breaks between items)
- [x] Edit window: only show tabbed individual names (not full sentence) when editing
- [x] Keep current inline formatting when NOT editing (food names in same line)
- [x] Timestamps: format in a consistent column next to the edit button
- [x] Trends button: manual press overrides the 3-day minimum, gives advice on current data immediately
- [x] Keep 3-day auto-trigger rule for unprompted recommendations (prompt still prefers multi-day trends when available)

## Hybrid LocalStorage + Database Backup
- [x] Add nutritionBackup table to drizzle schema (userId, dataType, jsonData, updatedAt)
- [x] Add server-side tRPC endpoints: nutrition.backup (save) and nutrition.restore (load)
- [x] Add client-side background sync: auto-backup after each food log change (5s debounce)
- [x] Add restore-from-backup logic: on app load, if localStorage is empty but backup exists, restore
- [x] Write vitest tests for backup/restore endpoints (3 new tests: backup, restore, auth rejection)

## Calorie Header Redesign
- [x] Make current/total calories display larger and more prominent at top of tracker
- [x] Right-align the calorie display with bold/accent styling + remaining/over indicator

## UI Fixes v3
- [x] Remove green cloud backup status icon (keep backup working silently)
- [x] Remove "calories left" / "over" text under the big calorie number
- [x] Fix food detail popup showing "HIGH" confidence label — removed
- [x] Add food detail popup to common items and daily preset items (tap to see macros/micros)
- [x] Remove "2,300 CAL TARGET" tag from the Nutrition Tracker banner in Home.tsx

## UI Fixes v4
- [x] Show confidence badge only when LOW (not high/medium) — warn user when AI is unsure
- [x] Add edit button to daily preset items (re-analyze with new name)
- [x] Add edit button to common items (re-analyze with new name)
- [x] Remove "(X left)" and "(+X over)" parentheses from macro progress bars
- [x] Remove info ⓘ icon from daily and common item rows

## Adjustable Macro Targets, Swipe-to-Delete, Fill Macros+Micros
- [x] Adjustable macro targets: add settings UI to change calorie/protein/carb/fat goals
- [x] Persist macro targets in localStorage (with backup sync)
- [x] Swipe-to-delete on food entries for faster mobile interaction
- [x] Upgrade Fill My Macros to also analyze micronutrient gaps
- [x] Unified AI suggestion: foods that fill both macro AND micro gaps simultaneously
- [x] Renamed to "Fill My Gaps" with micro badges on each suggestion

## Weekly Trend Chart Popup
- [x] Add chart icon (BarChart3) next to header
- [x] Tap opens a modal with 7-day calorie + protein bar chart
- [x] Show daily totals with target line overlay + weekly averages
- [x] Tap outside to close

## Meal Planner Wizard
- [x] Add meal planner icon button in the action buttons area
- [x] Wizard popup with checkboxes: "Single Meal" vs "Meal Prep"
- [x] Meal Prep: auto-focus days slider (2-7 days) when checked
- [x] Food style quick-select options (comfort, lean/clean, international, etc.)
- [x] "Surprise Me" checkbox that overrides food style selection
- [x] Optional text box for specific requests
- [x] Server-side AI endpoint: nutrition.planMeal — accepts meal type, days, style, current gaps
- [x] AI generates meal(s) factoring in remaining macro + micro gaps
- [x] Meal prep mode: balance nutrition across all days
- [x] Display generated meal plan in the popup with macros/micros per meal

## Saved Meal Plans
- [x] Add "Save Plan" button on generated meal plan results
- [x] Store saved plans in localStorage (array of { id, name, date, meals, summary })
- [x] Include saved plans in the database backup sync
- [x] Add "Saved Plans" button/icon to access saved plans browser
- [x] Saved plans browser popup: list all saved plans with name, date, meal count
- [x] Tap a saved plan to expand and see full details (meals, macros, micros, ingredients)
- [x] Delete saved plans with confirmation
- [x] Tap outside to close

## Meal Plan Ratings
- [x] Add rating field (1-5 stars) to SavedMealPlan interface
- [x] Add star rating UI on each saved plan in the browser (tap to rate)
- [x] Show rating stars in the collapsed plan header view
- [x] Persist ratings in localStorage + database backup
- [x] Feed rated plans into AI meal planner prompt as taste preferences
- [x] AI prompt: favor similar ingredients/styles from highly-rated plans, avoid low-rated ones

## Snap Pantry Feature
- [x] Server endpoint: nutrition.snapPantry — single AI call: identifies items, generates wishlist + meal + grocery list
- [x] Snap Pantry button in NutritionTracker action buttons area
- [x] Multi-photo capture flow (take multiple photos, then submit all at once)
- [x] Loading state while AI processes photos
- [x] AI silently identifies pantry items (user doesn't see raw list)
- [x] Short wishlist of items that would unlock better meals
- [x] Recommended meal using pantry items + daily nutrition gaps
- [x] Grocery list with checkboxes — checked items get strikethrough/grey
- [x] Ingredients marked as "have" vs "need" in meal display
- [x] Factor in remaining daily macros/micros when recommending meal
- [x] Factor in taste preferences from rated saved plans
- [x] Tap outside to close
