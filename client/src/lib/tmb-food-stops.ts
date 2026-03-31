// TMB Food Stops — shared data for DailyBudget, TMBRouteMap, and ElevationProfile
// mileIn = approximate miles into that day's hike when you reach the stop
// mileAbs = approximate absolute trail mile from start (mile 0 = RockyPop/Les Houches)
// lat/lng for map markers, ele (ft) for elevation profile dots

export interface FoodStopGeo {
  name: string;
  day: number;
  mileIn: number;    // miles into the day
  mileAbs: number;   // absolute trail mile
  lat: number;
  lng: number;
  ele: number;       // elevation in feet
  type: "refuge" | "restaurant" | "cafe" | "supermarket" | "food-truck";
  highlight?: boolean;
}

// Day start absolute miles (from elevation profile accommodations)
const DAY_STARTS: Record<number, number> = {
  0: 0,       // Arrival day in Chamonix
  1: 0,       // Les Houches start
  2: 12.76,   // Gîte Le Pontet
  3: 22.93,   // Base Camp Lodge
  4: 31.75,   // Rifugio Elisabetta
  5: 38.01,   // Rifugio Maison Vieille
  6: 47.94,   // Rifugio Chapy
  7: 62.23,   // Gîte La Peule
  8: 76.04,   // Relais D'Arpette
  9: 85.53,   // Auberge Mont Blanc
  10: 97.83,  // Grassonnet
};

// Total hiking miles per day (from TMB_ITINERARY distanceMi)
export const DAY_MILES: Record<number, number> = {
  0: 0,      // Arrival day
  1: 12.8,
  2: 10.2,
  3: 8.8,
  4: 6.3,
  5: 9.9,
  6: 14.3,
  7: 13.8,
  8: 9.5,
  9: 12.3,
  10: 10.5,
};

export const FOOD_STOPS: FoodStopGeo[] = [
  // ── Day 0: Chamonix (arrival day, town stops — no trail mileage) ──
  { name: "Cool Cats Hot Dogs",       day: 0, mileIn: 0, mileAbs: 0,     lat: 45.9237, lng: 6.8694, ele: 3400, type: "restaurant" },
  { name: "Big Mountain Brewing Co.", day: 0, mileIn: 0, mileAbs: 0,     lat: 45.9230, lng: 6.8700, ele: 3400, type: "restaurant", highlight: true },
  { name: "Chamonix Supermarket",     day: 0, mileIn: 0, mileAbs: 0,     lat: 45.9235, lng: 6.8690, ele: 3400, type: "supermarket" },

  // ── Day 1: Les Houches → Gîte Le Pontet (12.8 mi) ──
  { name: "Col de Voza",              day: 1, mileIn: 3.5,  mileAbs: 3.5,  lat: 45.8650, lng: 6.7860, ele: 5440,  type: "refuge", highlight: true },
  { name: "Refuge de Miage",          day: 1, mileIn: 7.0,  mileAbs: 7.0,  lat: 45.8350, lng: 6.7600, ele: 5580,  type: "refuge", highlight: true },
  { name: "Les Contamines Supermarket", day: 1, mileIn: 11.0, mileAbs: 11.0, lat: 45.8210, lng: 6.7270, ele: 3770, type: "supermarket" },

  // ── Day 2: Les Contamines → Les Chapieux (10.2 mi) ──
  { name: "Refuge Nant-Borrant",      day: 2, mileIn: 3.0,  mileAbs: 15.76, lat: 45.7640, lng: 6.7230, ele: 5200,  type: "refuge" },
  { name: "Le Relais Montagnard",     day: 2, mileIn: 10.0, mileAbs: 22.76, lat: 45.7100, lng: 6.7340, ele: 4920,  type: "restaurant", highlight: true },

  // ── Day 3: Base Camp Lodge → Rifugio Elisabetta (8.8 mi) ──
  { name: "Chambres du Soleil",       day: 3, mileIn: 1.0,  mileAbs: 23.93, lat: 45.7050, lng: 6.7350, ele: 5100,  type: "refuge" },
  { name: "Refuge des Mottets",       day: 3, mileIn: 5.0,  mileAbs: 27.93, lat: 45.7320, lng: 6.7700, ele: 6070,  type: "refuge" },

  // ── Day 4: Rifugio Elisabetta → Maison Vieille (6.3 mi) ──
  { name: "Cabane du Combal",         day: 4, mileIn: 3.0,  mileAbs: 34.75, lat: 45.7770, lng: 6.8580, ele: 6560,  type: "refuge", highlight: true },
  { name: "Maison Vieille",           day: 4, mileIn: 6.0,  mileAbs: 37.75, lat: 45.7908, lng: 6.9313, ele: 6420,  type: "refuge" },

  // ── Day 5: Maison Vieille → Rifugio Chapy (9.9 mi) ──
  { name: "Courmayeur Restaurants",   day: 5, mileIn: 3.0,  mileAbs: 41.01, lat: 45.7966, lng: 6.9690, ele: 3940,  type: "restaurant", highlight: true },
  { name: "Courmayeur Supermarket",   day: 5, mileIn: 3.2,  mileAbs: 41.21, lat: 45.7960, lng: 6.9685, ele: 3940,  type: "supermarket" },
  { name: "Rifugio Bertone",          day: 5, mileIn: 5.5,  mileAbs: 43.51, lat: 45.8050, lng: 6.9750, ele: 6560,  type: "refuge" },

  // ── Day 6: Rifugio Chapy → La Peule (14.3 mi) ──
  { name: "Rifugio Bonatti",          day: 6, mileIn: 5.0,  mileAbs: 52.94, lat: 45.8700, lng: 7.0450, ele: 6640,  type: "refuge", highlight: true },
  { name: "Chalet Val Ferret",        day: 6, mileIn: 7.0,  mileAbs: 54.94, lat: 45.8800, lng: 7.0600, ele: 5900,  type: "refuge" },
  { name: "Rifugio Elena",            day: 6, mileIn: 10.0, mileAbs: 57.94, lat: 45.8900, lng: 7.0850, ele: 7050,  type: "refuge" },
  { name: "Refuge La Peule",          day: 6, mileIn: 14.0, mileAbs: 61.94, lat: 45.8986, lng: 7.1127, ele: 6900,  type: "refuge" },

  // ── Day 7: La Peule → Relais D'Arpette (13.8 mi) ──
  { name: "Mont Fromage Food Truck",  day: 7, mileIn: 3.0,  mileAbs: 65.23, lat: 45.9330, lng: 7.0950, ele: 5250,  type: "food-truck", highlight: true },
  { name: "La Fouly Supermarket",     day: 7, mileIn: 3.2,  mileAbs: 65.43, lat: 45.9340, lng: 7.0940, ele: 5250,  type: "supermarket" },
  { name: "La Kabana Crêpes",         day: 7, mileIn: 7.0,  mileAbs: 69.23, lat: 45.9700, lng: 7.0900, ele: 4600,  type: "cafe", highlight: true },
  { name: "Le Cabanon (Champex Lac)", day: 7, mileIn: 10.0, mileAbs: 72.23, lat: 46.0250, lng: 7.1130, ele: 4790,  type: "restaurant" },

  // ── Day 8: Relais D'Arpette → Auberge Mont Blanc (9.5 mi) ──
  { name: "Alpage de Bovine",         day: 8, mileIn: 5.0,  mileAbs: 81.04, lat: 46.0600, lng: 7.0400, ele: 6230,  type: "refuge", highlight: true },
  { name: "Col de la Forclaz",        day: 8, mileIn: 8.0,  mileAbs: 84.04, lat: 46.0570, lng: 7.0100, ele: 4920,  type: "restaurant" },

  // ── Day 9: Trient → Grassonnet (12.3 mi) ──
  { name: "Refuge du Col de Balme",   day: 9, mileIn: 4.0, mileAbs: 89.53, lat: 46.0267, lng: 6.9700, ele: 7190, type: "refuge", highlight: true },

  // ── Day 10: Grassonnet → Planpraz → Chamonix (10.5 mi) ──
  { name: "Refuge du Lac Blanc",      day: 10, mileIn: 5.0,  mileAbs: 102.83, lat: 45.9700, lng: 6.8850, ele: 7710, type: "refuge" },
  { name: "La Bergerie du Plan Praz", day: 10, mileIn: 8.0,  mileAbs: 105.83, lat: 45.9400, lng: 6.8530, ele: 6560, type: "restaurant" },
  { name: "Le Brévent Panoramic",     day: 10, mileIn: 9.0,  mileAbs: 106.83, lat: 45.9350, lng: 6.8400, ele: 8284, type: "restaurant", highlight: true },
];

// Helper: get food stops for a specific day
export function getStopsForDay(day: number): FoodStopGeo[] {
  return FOOD_STOPS.filter(s => s.day === day);
}

// Helper: get day start mile
export function getDayStartMile(day: number): number {
  return DAY_STARTS[day] ?? 0;
}
