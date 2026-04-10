# Ghost D10 Analysis

The elevation profile data has TWO entries with day=10:
- "Gte Le Nouveau Grassonnet" at dist=97.83 (start of Day 10)
- "Planpraz → Chamonix" at dist=108.33 (end of Day 10 / finish)

The `visibleAccoms` filter only checks if the accommodation's dist falls within the visible distance window. It does NOT filter by selected day. So when you're zoomed into Day 7 (around miles 62-76), both D10 entries at miles 97 and 108 may still appear if the window is wide enough.

The HotelDot component renders `D${accom.day}` which is "D10" for both entries. The finish one shows a flag emoji instead.

Fix: The ghost D10 circles appear because the visibleAccoms filter is purely distance-based. When zoomed to a specific day, markers from other days at nearby distances bleed through. Need to filter visibleAccoms to only show the selected day's markers when a day is zoomed in.

The `zoomedDay` state tracks which day is zoomed in the elevation profile. When zoomedDay is set, we should filter visibleAccoms to only show accommodations for that day and adjacent days (day-1 and day+1 for context).
