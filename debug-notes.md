# Bug Analysis Notes

## 1. Ghost D10 purple circles
- There are TWO Day 10 accommodations in the data: "Gte Le Nouveau Grassonnet" (dist 97.8) and "Planpraz → Chamonix" (dist 108.3)
- Both render as purple D10 circles via HotelDot
- The second one (Chamonix) should show as finish flag (🏁) but the check is `accom.day === 10 && accom.name.includes("Chamonix")` - the name is "Planpraz → Chamonix" which DOES include "Chamonix"
- So the ghost issue is likely that when zoomed into a day range, the accommodation markers from other days still render because visibleAccoms only filters by distance window, not by selected day
- When user clicks on different days, the D10 markers at dist 97.8 persist because they fall within the visible distance window

## 2. Toolbar button differentiation
- All 5 buttons (SAT/FOOD/LOCATE/MAP/MORE) use same grey styling when inactive
- FOOD and GPS have active states with color (amber, blue)
- MAP/ELEV has active state (rose)
- SAT and MORE have no color differentiation
- User wants subtle visual cues to differentiate them even when inactive

## 3. Day-circle buttons for map view
- The purple day-circle buttons at bottom of elevation profile (accommodation strip) are only in ElevationProfile
- User wants similar day-circle selector in map view too
- TMBRouteMap already has pill buttons (ALL, ARR, D1...) but not the circle style

## 4. Food stops on elevation profile not toggleable
- ElevationProfile has its OWN internal showFoodStops state (line 368)
- TMBRouteMap's FOOD button toggles TMBRouteMap's showFoodStops state
- But TMBRouteMap doesn't pass showFoodStops to ElevationProfile
- So the FOOD button in the toolbar only affects the map, not the elevation profile
- Fix: Pass showFoodStops from TMBRouteMap into ElevationProfile as a prop
