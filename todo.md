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

## Snap Pantry Multi-Meal Options
- [x] Update AI schema to return up to 5 meal options instead of 1 (already done server-side)
- [x] Up to 50% of meals can be calorie-flexible ("Flex" badge on card)
- [x] Each meal has a brief name (2-5 words)
- [x] Frontend: show meal options as compact cards with brief names + macros
- [x] Tap a meal card to expand and see full details (ingredients, macros, micros, instructions)
- [x] "Make This One" button on expanded meal to proceed
- [x] After selection: show selected meal summary + grocery list + "Other Meals" back button
- [x] Keep the grocery list checkbox/strikethrough behavior
## Text-Based Food Entry (Type Food)
- [x] Server endpoint: nutrition.analyzeText — accepts text description, returns analysis or clarifying question
- [x] AI triage step: decides if description is clear enough or needs one clarifying question
- [x] Clarification flow: AI asks question → user answers → AI analyzes with context
- [x] Direct analysis: if description is specific enough, skips clarification and analyzes immediately
- [x] Frontend: "Type Food" button in action buttons area (same prominence as Snap Food)
- [x] Text input panel with textarea, Enter-to-submit, Analyze button
- [x] Clarification step UI: shows AI question with sparkle icon, input field for answer
- [x] Result display: food name, confidence, serving estimate, macros, Confirm/Edit/Discard buttons
- [x] Confirm adds entry to today's log (same as photo-based entries)
- [x] Edit button returns to text input step to modify description
- [x] Updated empty state to mention both Snap and Type options
- [x] Vitest tests: direct analysis and clarification flow (11 tests total, all passing)

## Reference Object Portion Scaling
- [x] Update AI photo analysis prompt to detect known reference objects in frame
- [x] Include common object dimensions: cans, bottles, plates, utensils, phones, hands/fingers, credit cards
- [x] AI uses detected reference to calibrate portion size estimates
- [x] AI notes in servingEstimate when a reference object was used
- [x] Add subtle tip near Snap Food button about placing a known object next to food

## Edit Food Modal Redesign
- [x] Replace multiple separate text boxes with single large textarea
- [x] Remove individual X delete buttons and "+ ADD ITEM" link
- [x] Auto-format multi-item entries with bullet points (•) when opening edit modal
- [x] Single-item entries show plain text without bullet
- [x] Textarea tall enough to see full description (~6 lines)
- [x] Update helper text to "Edit the full description — AI will re-estimate all nutrients."
- [x] Condensed log view stays comma-separated (no change)
- [x] On confirm, convert bullet-pointed text back to comma-separated for storage/analysis

## Button Grid Redesign (3x3 Color-Coded)
- [x] Replace 4-row button layout with 3x3 grid of square tiles
- [x] Row 1 (orange outlined): SNAP FOOD, TYPE FOOD, SNAP PANTRY
- [x] Row 2 (teal outlined): DAILY ITEMS, COMMON, FILL MY GAPS
- [x] Row 3 (purple outlined): TRENDS, WEEKLY, PLAN MEAL
- [x] Icons stacked above text labels in each tile
- [x] All tiles dark background with colored border, icon, and text
- [x] Remove separate SNAP PANTRY button below the grid

## BF% Projection Table Spacing Fix
- [x] Separate NOW/GOAL into pill badges instead of appending to fat text
- [x] Add generous column spacing between weight, BF%, lean, fat
- [x] Add colored left border on NOW (orange) and GOAL (green) rows
- [x] Remove "fat" label from NOW/GOAL rows (badge replaces it)

## BF Estimator Header Cleanup & Cursor Fix
- [x] Remove NAVY METHOD badge from header
- [x] Add translucent orange MULTI-FORMULA COMPOSITE pill badge
- [x] Remove asterisks (*) from Neck and Waist labels
- [x] Remove "Required for Navy formula" from bottom note
- [x] Fix number input cursor to land at end of value on focus (all inputs app-wide)

## Nutrition Tracker Header Update
- [x] Change emoji from camera (📸) to apple (🍎)
- [x] Keep subtitle "Photo-based calorie tracking"
- [x] Add dynamic calorie badge showing current/target cal in translucent green pill
- [x] Badge updates in real-time as food entries are added/removed

## Fill My Gaps Rebuild (Multi-Day Nutrient Analysis)
- [x] Server endpoint: analyze multi-day nutrient intake from all available food log days
- [x] Average daily micronutrient intake across all days, compare against RDV
- [x] Flag consistently low micronutrients (below 60% of target)
- [x] Flag significant macro imbalances (protein, carbs, fat)
- [x] AI suggests specific foods that efficiently cover multiple deficiencies
- [x] Graceful degradation: works with 1-2 days, notes limited data, improves with more
- [x] Show number of days analyzed and confidence note
- [x] Rebuild Fill My Gaps UI panel with multi-day analysis display
- [x] Prioritize micronutrients, show macro notes when significantly off
- [x] Write tests for the new endpoint

## TMB Route Map UI Improvements
- [x] Change day markers from orange to a high-contrast color (cyan/teal) that pops against topo map background
- [x] Fix map control buttons: equal widths, centered text, consistent height, no text cutoff

## Tiered Macro/Calorie Color System
- [x] Replace binary green/red with tiered colors: green (under), yellow/amber (slightly over ~10%), red (significantly over >10%)
- [x] Apply to big calorie number, header badge, and all macro progress bars (protein, carbs, fat)
- [x] Make slightly-over feel informational not alarming

## Macro Bar Color & Food Edit Popup
- [x] Keep macro progress bar colors unchanged when over target (no red bar)
- [x] Add translucent highlight behind macro label name to indicate over-target
- [x] Replace tiny inline food entry edit with large popup modal with big text field

## Swipe-to-Delete with Confirmation
- [x] Create reusable SwipeToDelete wrapper component (touch + mouse drag)
- [x] Create reusable ConfirmDeleteDialog popup component
- [x] Add swipe-to-delete to NutritionTracker food entries
- [x] Add swipe-to-delete to all other components with trash icons
- [x] Ensure confirmation popup appears before any delete action

## Weekly Chart Bar Scaling
- [x] Scale weekly chart bars relative to max recorded value (not target) so highest day = 100% width
- [x] Makes it easy to visually compare which day was highest

## Arcade-Style Double-Fill Macro Bars
- [x] When over target, bar fills 100% in normal color, then overflow starts filling from left in lighter/darker shade
- [x] Like old arcade fighting game health bars with multiple layers
- [x] Apply to all macro progress bars (calories, protein, carbs, fat)

## Theme Switcher (10 Fun Themes)
- [x] Create small theme button in home screen header area
- [x] Dropdown/popup with 10 theme options, each styled as a mini preview card
- [x] Define 10 themes with fun names and distinct color palettes
- [x] Each theme changes CSS variables app-wide (background, foreground, primary, accent, borders, etc.)
- [x] Persist selected theme in localStorage
- [x] Themes: Alpine Dawn, Glacier Ice, Midnight Summit, Forest Floor, Volcanic, Bluebird Day, Wildflower, Storm Warning, Golden Hour, Snowblind

## Body Fat Estimator Banner
- [x] Replace composite banner image with dynamic current BF% display

## Editable Workout Sessions
- [x] Make logged workout sessions editable (tap to edit exercises, sets, reps, weights)
- [x] Add edit button/icon to each logged session
- [x] Create edit modal/popup with pre-filled session data
- [x] Save edited session back to localStorage

## Workout Edit Fixes
- [x] Fix workout session edit not saving (save button not persisting changes)
- [x] Add ability to change the date of a logged workout session

## Coach Sierra AI Chat
- [x] Create server-side tRPC procedure for AI chat with full context (workouts, weight, body fat, nutrition, TMB trip details)
- [x] Build near-full-screen slide-up chat panel UI
- [x] Add TACTICAL-to-PERSONAL slider to control response style
- [x] Coach Sierra persona: direct, no-fluff, bullet points by default, occasional motivation
- [x] Small sparkle button in Training Protocol section to open chat
- [x] No consistency scoring or guilt trips about workout frequency
- [x] Include TMB trip context (10 days, 109.5mi, 34k ft gain, daily stages)

## Hike/Cardio Session Edit Fields
- [x] Fix workout edit mode: hike/cardio sessions should NOT show "weight" and "reps" labels
- [x] Make edit fields context-aware based on exercise type (gym vs cardio/hike)

## Delete Confirmation Audit (PERMANENT RULE)
- [x] Full audit: every delete action in the entire app MUST have a ConfirmDeleteDialog
- [x] This is a permanent rule: any future deletable item must also have confirmation

## Training Protocol UI Fix
- [x] Remove "pick one" text from Day C subtitle
- [x] Align all START buttons vertically (consistent right-alignment)

## Coach Sierra Button Visibility Fix
- [ ] Investigate why the AI/Coach Sierra button is not visible or findable
- [ ] Fix button visibility so user can easily access Coach Sierra
- [x] Add Threshold Training exercise to Day C cardio options
- [x] Fix "fill in the gaps" button showing blank window
- [x] Fix NaN values in multiDayMicros avgPercent causing Fill My Gaps validation error
- [x] Show today's logged calories in Nutrition Tracker banner on app load (not just when expanded)

## Fill My Gaps Redesign (Macro/Micro Toggles + Calorie Slider)
- [x] Add two toggle buttons at top of Fill My Gaps panel: MACROS and MICROS (both can be on/off)
- [x] Add calorie slider below toggles (range: 100-1000 cal, default 500) to cap suggestion calories
- [x] Update client-side handleFillMacros to pass mode (macro/micro/both) and calorie cap to server
- [x] Update server-side AI prompt to only analyze macros, micros, or both based on user selection
- [x] AI suggestions must stay under the calorie cap from the slider
- [x] Write vitest tests for mode and calorieCap params (2 new tests, 21 total)
- [x] Show today's logged calories in Nutrition Tracker banner on app load (not just when expanded)

## Bug Fixes Batch (April 2026)
- [x] Fix CoachSierra.tsx JSX fragment error (adjacent elements not wrapped)
- [x] Fix calorie banner showing 0 cal on app load (useEffect to read localStorage on mount)
- [x] Fix France legend color in TMBRouteMap — legend shows purple but trails are orange

## TMBRouteMap Fixes (April 2026 batch 2)
- [x] Fix ghost day markers (purple D10 circles) persisting on elevation profile when switching days
- [x] Differentiate toolbar buttons (SAT/FOOD/LOCATE/MAP/MORE) visually — subtle color coding while keeping same size
- [x] Add purple day-circle selector buttons to the map view (currently only on elevation profile)
- [x] Make food stops on elevation profile toggleable via FOOD button (currently always visible)

## TMBRouteMap Fixes (April 2026 batch 3)
- [x] Double-tap day circle button on map zooms out to full trail (like elevation profile toggle)
- [x] Remove old oval pill day selector buttons from map section (ALL/ARR/D1/D2...)
- [x] Fix ARR circle button not centering map to arrival area
- [x] Food toggle on map should show ALL visible food stops based on zoom level, not just selected day
- [x] Enrich food stop popups with descriptions, must-try items, operating hours for the specific hiking day
- [x] Add food stop popup to elevation profile (currently only on map)
- [x] Fix ghost D10 purple circles still appearing on elevation profile (need deeper fix)

## Accommodation Section Redesign + Elevation Food Hitbox (April 2026 batch 4)
- [x] Move accommodation photo cards from main view into a collapsible dropdown section
- [x] Add hostel detail popup when tapping an accommodation card (confirmation code, phone, check-in tips, hiker intel)
- [x] Structure popup fields for future data entry (confirmation codes, etc.)
- [x] Fix food stop diamond hitbox on elevation profile — make diamonds clickable with larger tap target
- [x] Add food stop popup on elevation profile diamonds (matching map popup style with enriched info)

## Coach Sierra Photo Library & Chat UI (April 2026)
- [x] Generate 20 Sierra photos with varied expressions and outfits
- [x] Wire photos into CoachSierra chat as large rotating images per message
- [x] Display Sierra photo large enough to see clearly (not tiny avatar bubble)
- [x] Update Sierra's personality to warm companion/training partner (not just coach)
- [x] Different outfits across photos (black tank, white crop top, burgundy jacket, olive flannel, blue sundress, navy henley)

## Coach Sierra Garmin Data Integration
- [x] Pass Garmin session data (HR zones, cardio drift, calories, distance, elevation) to Coach Sierra
- [x] Pass weekly volume trends to Coach Sierra
- [x] Update server coach procedure to accept and include garminData in context
- [x] Update Sierra's system prompt to reference Garmin data intelligently
- [x] Make far-right slider position (Personal mode) much more intimate and personal
- [x] Fix clear chat confirmation dialog showing behind coach chat overlay (needs higher z-index)

## Coach Sierra Image Upload
- [x] Add server-side image upload endpoint (upload to S3, return URL)
- [x] Update coach chat procedure to accept image URLs in messages
- [x] Add photo button to chat input area (gallery/camera pick)
- [x] Add clipboard paste support (Ctrl+V / long-press paste)
- [x] Show image preview in chat before sending
- [x] Display sent images in chat message history
- [x] Write vitest tests for coach upload + chat with images (7 tests)

## Coach Sierra Photo Library Refresh (Full Replacement)
- [x] Generate 20 new diverse Sierra photos — every photo in different clothing
- [x] Include athletic/active shots (gym, running, hiking, stretching)
- [x] Include spicier/stylish shots (going out, confident poses)
- [x] Include casual lifestyle shots (cafe, relaxing, outdoors)
- [x] Upload all photos to CDN and replace sierra-photos.ts entries
- [x] Save checkpoint and deliver

## Fill My Gaps Redesign
- [x] Add two toggle buttons at top of Fill My Gaps panel: MACROS and MICROS (both can be on/off)
- [x] Add calorie slider below toggles (range: 100-1000 cal, default 500) to cap suggestion calories
- [x] Update client-side handleFillMacros to pass mode (macro/micro/both) and calorie cap to server
- [x] Update server-side AI prompt to only analyze macros, micros, or both based on user selection
- [x] AI suggestions must stay under the calorie cap from the slider
- [x] Write vitest tests for mode and calorieCap params (2 new tests, 21 total)

## Arrival & Departure Tab
- [x] Create travel data file with all arrival/departure content
- [x] Add Arrival & Departure navigation tab to Home.tsx
- [x] Build ArrivalDeparture component with collapsible sections
- [x] Section: International Travel Guide (first-timer walkthrough)
- [x] Section: Flight Details (placeholder for user's flight info)
- [x] Section: Geneva → Chamonix Transport (FlixBus focus + alternatives)
- [x] Section: Money & Currency Guide (ATMs, cash-only refuges, tips)
- [x] Section: eSIM / Connectivity (eSIM options for Meta phone)
- [x] Section: Chamonix Essentials Map (supermarket, Decathlon, ATMs with Google Maps links)
- [x] Section: Pre-Hike Checklist (interactive checklist)
- [x] Section: Things to Do Day Before (activities in Chamonix)
- [x] Section: Return Transport (Chamonix → Geneva, timeline)
- [x] Section: Side Trip Option (Annecy)

## Coach Sierra Full Data Access
- [x] Fix nutrition data serialization (wrong localStorage key: tmb-nutrition-entries → tmb-nutrition-log)
- [x] Send full 7-day nutrition logs (every food, calories, macros, micros per day)
- [x] Send macro targets (custom calorie/protein/carbs/fat goals)
- [x] Send micronutrient gap analysis (which vitamins/minerals consistently low)
- [x] Send weekly calorie/protein trends (day-by-day totals)
- [x] Send saved meal plans and ratings
- [x] Send gear checklist progress (what's packed, what's missing)
- [x] Send pre-trip checklist status (from Travel tab)
- [x] Update CoachSierra props to accept new data fields
- [x] Update server coach.ts system prompt to reference all new data intelligently
- [x] All 21 tests passing (no new tests needed — data is serialized client-side)

## TMB Water Sources on Maps
- [x] Deep research: water sources along all 10 TMB stages (fountains, taps, streams, refuges)
- [x] Compile water source data with GPS coords, type, late July description, distances
- [x] Blue water drop markers on overhead map with toggle: potable only → potable + filtered
- [x] Red outline on last-before-dry-stretch drops ("fill up here" warning)
- [x] Blue water drop markers on elevation profile with same toggle
- [x] Tappable popups: source name, type, late July conditions, distance to next source
- [x] Density toggle: default shows primary (~every 3mi), "MORE" button reveals secondary sources
- [x] Filtered sources marked with "F" label and lighter blue to distinguish from potable
- [x] Flag dry stretches in descriptions and popup warnings
- [x] Synced water toggle state between overhead map and elevation profile views

## Offline Mode (PARKED FOR LATER)
- [ ] Offline PDF export (compact: itinerary, water sources, emergency info, key phrases)
- [ ] Small unobtrusive download button in Travel tab

## Garmin Data Update (10 new FIT files)
- [x] Parse 10 uploaded Garmin .zip FIT files (Mar 29 – Apr 9, 2026)
- [x] Add 10 new sessions to garmin-data.ts (2 hikes, 8 strength)
- [x] Update WEEKLY_VOLUME with W13 and W14 data
- [x] TypeScript clean, all 21 tests passing

## BF Calculator UI Fixes + Coach BF Data Access
- [x] Round circumference values to 1 decimal place on unit conversion
- [x] Sync tape unit toggle with global MI/KM unit toggle (useEffect on uu.isMetric)
- [x] Fix BF% projection table: 18% uses yellow (Average category), not red
- [x] Fix BF% projection table: grid with tabular-nums and fixed column widths
- [x] Give Coach Sierra full body fat data (history with all formulas, measurements, lean/fat mass, goal projection)
- [x] Add BODY COMPOSITION AWARENESS section to Sierra's system prompt
- [x] Write 2 new vitest tests for body fat data injection (23 total tests passing)

## BF% Projection Table Redesign v2
- [x] First row shows actual current weight (221.5 lb), not rounded to nearest 5
- [x] Subsequent rows go down by 5 from nearest multiple of 5 below current weight
- [x] Weight text should be white (foreground) for all rows — not orange/green colored
- [x] BF% text uses proper category colors: yellow for 18% (Average), green for Athletic/Fitness, red for Essential
- [x] Remove NOW and GOAL pill badges — use only left border + translucent row tint to distinguish
- [x] Fix 18% showing as light-red instead of yellow (color threshold issue)
- [x] Create UI mockup for user approval before implementing

## Data Export for Analysis
- [ ] Add a tRPC endpoint to upload localStorage data (body fat entries, weight log) to the server
- [ ] Add a "Share Data for Analysis" button in the app that sends localStorage to server
- [ ] Retrieve the data and perform detailed body composition analysis

## Expandable BF% History Entries
- [x] Make saved BF% history entries tappable/expandable to show full measurements
- [x] Show all measurement values (neck, waist, hip, chest, bicep, forearm, thigh, wrist)
- [x] Show individual formula results (Navy, YMCA, Covert Bailey) with colored values
- [x] Show weight at time of measurement + fat mass + lean mass breakdown

## Bug: Expanded History Measurements Showing Raw Floats
- [x] Fix measurements in expanded history entries showing unrounded values (e.g. 17.3228346456692913 instead of 17.3)
- [x] Values are stored in inches with full float precision from cm->inch conversion; now rounded to 1 decimal
- [x] Added proper unit suffix (" for inches, cm for metric) and DRY loop over measurement fields

## Measurement Consistency Check
- [x] Compare new measurement values against previous entries before saving (>15% deviation threshold)
- [x] Flag values that deviate more than 15% from the last entry as potential outliers
- [x] Show warning modal with flagged measurements, previous vs current values, and % change
- [x] Allow user to save anyway or go back and fix (two-button modal)
- [x] Flag measurements outside reasonable anatomical ranges (e.g. neck 12-22", thigh 18-35")

## Cloud Data Sync (Cross-Device)
- [x] Reuse existing nutritionBackups table (key-value per user per data type)
- [x] Reuse existing backup/restore server endpoints (generic dataType + jsonData)
- [x] Sync weight log to server on every change (via localStorage.setItem intercept)
- [x] Sync BF% entries to server on every change
- [x] Sync workout sessions to server on every change
- [x] Sync nutrition data to server on every change
- [x] Sync gear list, macro targets, BF retention, prehike checklist, saved meal plans
- [x] Auto-load all data from server on login / app startup (if logged in)
- [x] Merge strategy: server data wins if localStorage is empty/null/[]
- [x] Works offline: localStorage remains primary store, server is backup + cross-device sync
- [x] Components re-read localStorage on cloud-sync-restored event (weight, workout, BF, gear)
- [x] Sync indicator in UI — sneaky 5px dot next to DAYS TO GO

## Sneaky Sync Status Indicator
- [x] Tiny 5px dot next to "DAYS TO GO" text
- [x] Invisible by default (opacity-0)
- [x] Pulsing grey/muted while syncing
- [x] Brief green flash (2.5s) when synced/restored, then fades out
- [x] Red flash on error (3s), then fades
- [x] Nearly invisible — just a dot after the text

## Garmin FIT File Upload
- [x] Add upload button/drop zone for Garmin .zip/.fit files
- [x] Parse FIT files server-side to extract workout data (heart rate, distance, elevation, zones, drift)
- [x] Store parsed sessions in database (nutritionBackups table with garmin-uploaded-sessions type)
- [x] Display upload UI in TrainingAnalytics component with drag-and-drop support
- [x] Support both .fit and .zip (containing .fit) formats
- [x] Write vitest tests for garmin router (upload, getSessions, deduplication, ZIP handling)

## Customizable Goal Weight
- [x] Make the goal weight in BF% projection table tappable/editable
- [x] Save custom goal weight to localStorage (and sync to server via cloud sync)
- [x] Update projection table rows dynamically based on new goal
- [ ] Update Altitude Gauge goal marker to reflect custom goal

## Offline PWA Mode
- [x] Create service worker via vite-plugin-pwa with Workbox caching
- [x] Add web app manifest for PWA install support (manifest, icons, Apple meta tags)
- [x] Cache app shell (JS, CSS, HTML, fonts) + CDN images on first load
- [x] Register service worker in main.tsx with hourly update checks
- [ ] Graceful offline states for server-dependent features (Coach Sierra, sync)
- [ ] Queue offline data changes and sync when connection returns
- [ ] Add install prompt / "Add to Home Screen" hint

## Altitude Gauge → Weight Descent Rename + Goal Weight Sync
- [x] Rename "Altitude Gauge" to "Weight Descent"
- [x] Wire custom goal weight from BF% projection table into the gauge component
- [x] Ensure gauge header, goal marker, progress calculation, and coach data all use the dynamic goal
