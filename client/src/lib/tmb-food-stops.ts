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
  // Enriched fields for popups
  description: string;
  mustTry?: string;
  hours?: string;       // typical food service hours
  payment: "card" | "cash" | "both";
  priceRange?: string;
  dayOfWeek: string;    // the actual day of week you'll be here
  date: string;         // the actual date you'll be here
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

// Trip dates: July 25 – August 4, 2026
const DAY_DATES: Record<number, { dayOfWeek: string; date: string }> = {
  0:  { dayOfWeek: "Saturday",  date: "Jul 25" },
  1:  { dayOfWeek: "Sunday",    date: "Jul 26" },
  2:  { dayOfWeek: "Monday",    date: "Jul 27" },
  3:  { dayOfWeek: "Tuesday",   date: "Jul 28" },
  4:  { dayOfWeek: "Wednesday", date: "Jul 29" },
  5:  { dayOfWeek: "Thursday",  date: "Jul 30" },
  6:  { dayOfWeek: "Friday",    date: "Jul 31" },
  7:  { dayOfWeek: "Saturday",  date: "Aug 1" },
  8:  { dayOfWeek: "Sunday",    date: "Aug 2" },
  9:  { dayOfWeek: "Monday",    date: "Aug 3" },
  10: { dayOfWeek: "Tuesday",   date: "Aug 4" },
};

export const FOOD_STOPS: FoodStopGeo[] = [
  // ── Day 0: Chamonix (arrival day — Saturday, Jul 25) ──
  {
    name: "Cool Cats Hot Dogs",
    day: 0, mileIn: 0, mileAbs: 0,
    lat: 45.9247, lng: 6.8706, ele: 3400,
    type: "restaurant",
    description: "Casual gourmet hot dogs in Chamonix center. Great first-night fuel after travel.",
    priceRange: "€8–12",
    payment: "card",
    hours: "11:30 AM – 9:00 PM",
    ...DAY_DATES[0],
  },
  {
    name: "Big Mountain Brewing Co.",
    day: 0, mileIn: 0, mileAbs: 0,
    lat: 45.9181, lng: 6.8638, ele: 3400,
    type: "restaurant", highlight: true,
    description: "Local craft brewery & pub food. Perfect pre-hike celebration spot.",
    mustTry: "Craft beer flight — sample all their Alpine brews before hitting the trail",
    priceRange: "€12–20",
    payment: "card",
    hours: "12:00 PM – 11:00 PM",
    ...DAY_DATES[0],
  },
  {
    name: "Chamonix Supermarket",
    day: 0, mileIn: 0, mileAbs: 0,
    lat: 45.9230, lng: 6.8722, ele: 3400,
    type: "supermarket",
    description: "Stock up on trail snacks, baguettes, cheese, and cured meats for the first few days.",
    priceRange: "€10–20",
    payment: "card",
    hours: "8:00 AM – 8:00 PM",
    ...DAY_DATES[0],
  },

  // ── Day 1: Les Houches → Gîte Le Pontet (12.8 mi — Sunday, Jul 26) ──
  {
    name: "Col de Voza",
    day: 1, mileIn: 3.5, mileAbs: 3.5,
    lat: 45.8780, lng: 6.7626, ele: 5440,
    type: "refuge", highlight: true,
    description: "Mountain refuge with stunning terrace views. Home to what many call the best pie on the entire TMB.",
    mustTry: "Blueberry pie — #1 rated treat on the whole trail! Also great paninis & beer.",
    priceRange: "€8–15",
    payment: "card",
    hours: "Drinks & pastries all day; lunch 11:30 AM – 2:30 PM",
    ...DAY_DATES[1],
  },
  {
    name: "Refuge de Miage",
    day: 1, mileIn: 7.0, mileAbs: 7.0,
    lat: 45.8392, lng: 6.7601, ele: 5580,
    type: "refuge", highlight: true,
    description: "Famous for enormous omelettes and blueberry pie. No picnicking at tables — eat by the creek nearby.",
    mustTry: "Giant omelette or blueberry tart — both legendary. Beer is excellent too.",
    priceRange: "€10–18",
    payment: "cash",
    hours: "Drinks & pastries all day; lunch 11:30 AM – 2:30 PM",
    ...DAY_DATES[1],
  },
  {
    name: "Les Contamines Supermarket",
    day: 1, mileIn: 11.0, mileAbs: 11.0,
    lat: 45.8217, lng: 6.7272, ele: 3770,
    type: "supermarket",
    description: "Last supermarket before remote mountain sections. Good restock point for snacks and sandwich ingredients.",
    priceRange: "€5–15",
    payment: "card",
    hours: "8:00 AM – 7:30 PM (Sun hours may be shorter)",
    ...DAY_DATES[1],
  },

  // ── Day 2: Les Contamines → Les Chapieux (10.2 mi — Monday, Jul 27) ──
  {
    name: "Refuge Nant-Borrant",
    day: 2, mileIn: 3.0, mileAbs: 15.76,
    lat: 45.7798, lng: 6.7143, ele: 5200,
    type: "refuge",
    description: "Trail lunch stop before Les Chapieux. Good soup and sandwiches.",
    priceRange: "€10–15",
    payment: "cash",
    hours: "Lunch 12:00 PM – 2:30 PM; drinks available outside meal hours",
    ...DAY_DATES[2],
  },
  {
    name: "Le Relais Montagnard",
    day: 2, mileIn: 10.0, mileAbs: 22.76,
    lat: 45.6977, lng: 6.7344, ele: 4920,
    type: "restaurant", highlight: true,
    description: "Pizzeria & camp store at Les Chapieux. The pizza here is legendary — hikers rave about it. Pre-made sandwiches are also excellent (with pickles!).",
    mustTry: "Pizza (from 6 PM only!) — order early, they sell out fast. Best sandwich on trail too.",
    priceRange: "€12–20",
    payment: "both",
    hours: "Camp store open all day; PIZZA FROM 6:00 PM ONLY — pre-order when you arrive!",
    ...DAY_DATES[2],
  },

  // ── Day 3: Base Camp Lodge → Rifugio Elisabetta (8.8 mi — Tuesday, Jul 28) ──
  {
    name: "Chambres du Soleil",
    day: 3, mileIn: 1.0, mileAbs: 23.93,
    lat: 45.6970, lng: 6.7339, ele: 5100,
    type: "refuge",
    description: "Lunch near Les Chapieux before the big climb to Col de la Seigne.",
    priceRange: "€10–15",
    payment: "cash",
    hours: "Lunch 11:30 AM – 2:00 PM; drinks available when open",
    ...DAY_DATES[3],
  },
  {
    name: "Refuge des Mottets",
    day: 3, mileIn: 5.0, mileAbs: 27.93,
    lat: 45.7514, lng: 6.8069, ele: 6070,
    type: "refuge",
    description: "Last French refuge before Col de la Seigne and the Italian border. Fill water here.",
    priceRange: "€8–12",
    payment: "cash",
    hours: "Lunch 12:00 PM – 2:00 PM; drinks & snacks available when open",
    ...DAY_DATES[3],
  },

  // ── Day 4: Rifugio Elisabetta → Maison Vieille (6.3 mi — Wednesday, Jul 29) ──
  {
    name: "Cabane du Combal",
    day: 4, mileIn: 3.0, mileAbs: 34.75,
    lat: 45.7764, lng: 6.8679, ele: 6560,
    type: "refuge", highlight: true,
    description: "Beautiful Val Veny setting. One of the highest-rated refuges on the trail for food quality.",
    mustTry: "Highly rated by hikers — excellent polenta, soups, and homemade desserts",
    priceRange: "€10–18",
    payment: "cash",
    hours: "Lunch 12:00 PM – 2:30 PM; drinks & cake available outside hours",
    ...DAY_DATES[4],
  },
  {
    name: "Maison Vieille",
    day: 4, mileIn: 6.0, mileAbs: 37.75,
    lat: 45.7909, lng: 6.9313, ele: 6420,
    type: "refuge",
    description: "Beer stop with views before the descent to Courmayeur. May NOT serve food outside meal hours.",
    mustTry: "Beer on the terrace — food is limited, so don't count on a full meal here",
    priceRange: "€5–8",
    payment: "card",
    hours: "Drinks available most of the day; food only during lunch 12:00 – 2:00 PM (not guaranteed)",
    ...DAY_DATES[4],
  },

  // ── Day 5: Maison Vieille → Rifugio Chapy (9.9 mi — Thursday, Jul 30) ──
  {
    name: "Courmayeur Restaurants",
    day: 5, mileIn: 3.0, mileAbs: 41.01,
    lat: 45.7966, lng: 6.9689, ele: 3940,
    type: "restaurant", highlight: true,
    description: "Town day in Courmayeur, Italy! Multiple restaurants, gelato shops, and cafes. La Remisa is the hiker favorite.",
    mustTry: "La Remisa pizza or fresh pasta. Italian gelato is a must! This is your splurge day.",
    priceRange: "€15–30",
    payment: "card",
    hours: "Restaurants typically 12:00 PM – 2:30 PM, 7:00 PM – 10:00 PM; gelato shops open all day",
    ...DAY_DATES[5],
  },
  {
    name: "Courmayeur Supermarket",
    day: 5, mileIn: 3.2, mileAbs: 41.21,
    lat: 45.8030, lng: 6.9650, ele: 3940,
    type: "supermarket",
    description: "Major restock point — last big town for a while. ATM available here too.",
    priceRange: "€10–20",
    payment: "card",
    hours: "8:00 AM – 8:00 PM",
    ...DAY_DATES[5],
  },
  {
    name: "Rifugio Bertone",
    day: 5, mileIn: 5.5, mileAbs: 43.51,
    lat: 45.8090, lng: 6.9785, ele: 6560,
    type: "refuge",
    description: "Cappuccino & pie with stunning views after the steep climb from Courmayeur.",
    mustTry: "Cappuccino + pie — the perfect reward after the climb. Cash only!",
    priceRange: "€8–12",
    payment: "cash",
    hours: "Drinks & pastries available when open; lunch 12:00 PM – 2:00 PM",
    ...DAY_DATES[5],
  },

  // ── Day 6: Rifugio Chapy → La Peule (14.3 mi — Friday, Jul 31) ──
  {
    name: "Rifugio Bonatti",
    day: 6, mileIn: 5.0, mileAbs: 52.94,
    lat: 45.8469, lng: 7.0337, ele: 6640,
    type: "refuge", highlight: true,
    description: "Iconic refuge with jaw-dropping Mont Blanc views. One of the most famous stops on the entire TMB.",
    mustTry: "Blueberry pie + aperol spritz — the legendary combo that cures all trail woes. Ties with Col de Voza for best pie.",
    priceRange: "€10–18",
    payment: "card",
    hours: "Restaurant lunch 12:00 PM – 2:00 PM; drinks, pie & cappuccino available all day. Open 7 days/week.",
    ...DAY_DATES[6],
  },
  {
    name: "Chalet Val Ferret",
    day: 6, mileIn: 7.0, mileAbs: 54.94,
    lat: 45.8709, lng: 7.0531, ele: 5900,
    type: "refuge",
    description: "One of the best food experiences on the TMB. Small restaurant open to non-guests with exceptional multi-course meals.",
    mustTry: "Polenta & sausage, lasagna, or carpaccio salad. Dinner here is outstanding if you're staying.",
    priceRange: "€12–25",
    payment: "card",
    hours: "Lunch 12:00 PM – 2:00 PM; dinner 7:00 PM (guests priority). Restaurant open to walk-ins for lunch.",
    ...DAY_DATES[6],
  },
  {
    name: "Rifugio Elena",
    day: 6, mileIn: 10.0, mileAbs: 57.94,
    lat: 45.8847, lng: 7.0656, ele: 7050,
    type: "refuge",
    description: "Last Italian refuge before Switzerland. A lifesaver in cold/wet weather.",
    mustTry: "Hot chocolate — 'the hot chocolate that saved my life' per hikers. Add espresso for extra warmth.",
    priceRange: "€5–10",
    payment: "card",
    hours: "Drinks available all day when open; lunch 12:00 PM – 2:00 PM",
    ...DAY_DATES[6],
  },
  {
    name: "Refuge La Peule",
    day: 6, mileIn: 14.0, mileAbs: 61.94,
    lat: 45.8983, lng: 7.1125, ele: 6900,
    type: "refuge",
    description: "First Swiss stop — cappuccino, soup, bread & cheese. Cozy after crossing into Switzerland.",
    mustTry: "Bone broth with bread & cheese — warming and hearty after a long day",
    priceRange: "€8–15",
    payment: "cash",
    hours: "Drinks & snacks available when open; dinner 7:00 PM (guests only)",
    ...DAY_DATES[6],
  },

  // ── Day 7: La Peule → Relais D'Arpette (13.8 mi — Saturday, Aug 1) ──
  {
    name: "Mont Fromage Food Truck",
    day: 7, mileIn: 3.0, mileAbs: 65.23,
    lat: 45.9312, lng: 7.0964, ele: 5250,
    type: "food-truck", highlight: true,
    description: "Food truck in La Fouly — 'Mount Cheese'! Fries, cheese, and beer. Perfect salty carb fix.",
    mustTry: "Fries & local beer — you'll be craving salt and carbs, and they deliver",
    priceRange: "CHF 10–18",
    payment: "cash",
    hours: "~11:00 AM – 5:00 PM (weather dependent, weekends busier)",
    ...DAY_DATES[7],
  },
  {
    name: "La Fouly Supermarket",
    day: 7, mileIn: 3.2, mileAbs: 65.43,
    lat: 45.9333, lng: 7.0984, ele: 5250,
    type: "supermarket",
    description: "Small Swiss supermarket for restocking. ATM available here for CHF.",
    priceRange: "CHF 10–20",
    payment: "card",
    hours: "8:00 AM – 6:30 PM (Sat hours may vary)",
    ...DAY_DATES[7],
  },
  {
    name: "La Kabana Crêpes",
    day: 7, mileIn: 7.0, mileAbs: 69.23,
    lat: 45.9829, lng: 7.1229, ele: 4600,
    type: "cafe", highlight: true,
    description: "Trail-side creperie — both savory and sweet crêpes. Hikers look forward to this for weeks.",
    mustTry: "Savory crêpe + cappuccino — 'I'd been looking forward to this for months!' per hikers",
    priceRange: "CHF 12–20",
    payment: "cash",
    hours: "~10:00 AM – 5:00 PM (seasonal, may close early in bad weather)",
    ...DAY_DATES[7],
  },
  {
    name: "Le Cabanon (Champex Lac)",
    day: 7, mileIn: 10.0, mileAbs: 72.23,
    lat: 46.0300, lng: 7.1165, ele: 4790,
    type: "restaurant",
    description: "Swiss restaurant in charming lakeside village of Champex Lac. Arrived too late for lunch? They may still have a small menu.",
    mustTry: "Swiss rösti — incredible! Also try a limoncello spritz (even better than aperol spritz).",
    priceRange: "CHF 18–30",
    payment: "card",
    hours: "Lunch 12:00 PM – 2:00 PM; dinner 6:30 PM – 9:00 PM. Small menu available between services.",
    ...DAY_DATES[7],
  },

  // ── Day 8: Relais D'Arpette → Auberge Mont Blanc (9.5 mi — Sunday, Aug 2) ──
  {
    name: "Alpage de Bovine",
    day: 8, mileIn: 5.0, mileAbs: 81.04,
    lat: 46.0554, lng: 7.0497, ele: 6230,
    type: "refuge", highlight: true,
    description: "Mountain buvette (alpine hut) with simple but perfect trail food. A cold-weather lifesaver.",
    mustTry: "Soup + chocolate cake — just enough to keep going on a cold rainy day. Beer is great too.",
    priceRange: "CHF 12–20",
    payment: "cash",
    hours: "~10:00 AM – 4:00 PM (weather dependent; no fixed schedule)",
    ...DAY_DATES[8],
  },
  {
    name: "Col de la Forclaz",
    day: 8, mileIn: 8.0, mileAbs: 84.04,
    lat: 46.0578, lng: 7.0012, ele: 4920,
    type: "restaurant",
    description: "Hotel restaurant at the pass — beer, fries, burgers. The hikers next to you will make you jealous if you don't order the burger.",
    mustTry: "Burger — you'll regret not ordering it when you see other hikers devouring theirs",
    priceRange: "CHF 15–25",
    payment: "card",
    hours: "Lunch 11:30 AM – 2:30 PM; dinner 6:30 PM – 9:00 PM. Bar open between services.",
    ...DAY_DATES[8],
  },

  // ── Day 9: Trient → Grassonnet (12.3 mi — Monday, Aug 3) ──
  {
    name: "Refuge du Col de Balme",
    day: 9, mileIn: 4.0, mileAbs: 89.53,
    lat: 46.0267, lng: 6.9701, ele: 7190,
    type: "refuge", highlight: true,
    description: "Refuge at the Swiss-French border pass. Back in France/EUR! Fewer food stops this day — don't skip this one.",
    mustTry: "Cappuccino + brownies — 'the best brownies I've ever had in my entire life' per multiple hikers",
    priceRange: "€8–15",
    payment: "both",
    hours: "Drinks & pastries available when open; lunch 12:00 PM – 2:00 PM",
    ...DAY_DATES[9],
  },

  // ── Day 10: Grassonnet → Planpraz → Chamonix (10.5 mi — Tuesday, Aug 4) ──
  {
    name: "Refuge du Lac Blanc",
    day: 10, mileIn: 5.0, mileAbs: 102.83,
    lat: 45.9760, lng: 6.8870, ele: 7710,
    type: "refuge",
    description: "Stunning alpine lake setting for lunch. One of the most photographed spots on the TMB.",
    priceRange: "€12–20",
    payment: "cash",
    hours: "Lunch 11:30 AM – 2:30 PM; drinks available when open",
    ...DAY_DATES[10],
  },
  {
    name: "La Bergerie du Plan Praz",
    day: 10, mileIn: 8.0, mileAbs: 105.83,
    lat: 45.9340, lng: 6.8530, ele: 6560,
    type: "restaurant",
    description: "Restaurant near the Planpraz cable car station. Good lunch before the final descent.",
    priceRange: "€12–25",
    payment: "card",
    hours: "11:00 AM – 4:00 PM (cable car hours dependent)",
    ...DAY_DATES[10],
  },
  {
    name: "Le Brévent Panoramic",
    day: 10, mileIn: 9.0, mileAbs: 106.83,
    lat: 45.9350, lng: 6.8400, ele: 8284,
    type: "restaurant", highlight: true,
    description: "Panoramic summit restaurant with 360° Mont Blanc views. The ultimate celebration spot to end your TMB.",
    mustTry: "Celebration meal with Mont Blanc views! You earned it. Treat yourself before the cable car down.",
    priceRange: "€20–35",
    payment: "card",
    hours: "11:00 AM – 4:00 PM (depends on cable car schedule; check weather)",
    ...DAY_DATES[10],
  },
];

// Helper: get food stops for a specific day
export function getStopsForDay(day: number): FoodStopGeo[] {
  return FOOD_STOPS.filter(s => s.day === day);
}

// Helper: get day start mile
export function getDayStartMile(day: number): number {
  return DAY_STARTS[day] ?? 0;
}
