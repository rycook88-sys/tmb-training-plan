// ── Arrival & Departure Data ────────────────────────────────────────
// All content for the Arrival & Departure tab

export interface TransportOption {
  name: string;
  type: "bus" | "shuttle" | "private";
  price: string;
  duration: string;
  url: string;
  notes: string;
  recommended?: boolean;
}

export interface ATMLocation {
  name: string;
  town: string;
  note: string;
  mapsQuery: string;
}

export interface CashOnlyRefuge {
  name: string;
  country: "France" | "Italy" | "Switzerland";
}

export interface EssentialLocation {
  name: string;
  category: "supermarket" | "gear" | "atm" | "pharmacy" | "tourist-office";
  address?: string;
  hours?: string;
  mapsQuery: string;
  note?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: "before-flight" | "at-airport" | "chamonix-arrival" | "pre-hike";
}

export interface Activity {
  name: string;
  description: string;
  duration: string;
  cost?: string;
  mapsQuery?: string;
  tip?: string;
}

export interface ESIMOption {
  name: string;
  price: string;
  data: string;
  url: string;
  note: string;
}

// ── Transport Options ───────────────────────────────────────────────

export const TRANSPORT_TO_CHAMONIX: TransportOption[] = [
  {
    name: "FlixBus",
    type: "bus",
    price: "€19–25",
    duration: "1h 10m – 2h",
    url: "https://www.flixbus.com/bus-routes/bus-geneva-airport-chamonix",
    notes: "Free WiFi + power outlets. E-ticket on phone. Runs roughly hourly. Can change booking if flight delayed.",
    recommended: true,
  },
  {
    name: "BlaBlaCar Bus",
    type: "bus",
    price: "€20–30",
    duration: "1.5–2h",
    url: "https://www.blablacar.com",
    notes: "Multiple daily departures from airport and city center. Sometimes contracts with Swiss Tours.",
  },
  {
    name: "AlpyBus (Shared Shuttle)",
    type: "shuttle",
    price: "€40–60",
    duration: "1.5h",
    url: "https://www.alpybus.com",
    notes: "Door-to-door shared transfer. More comfortable, drops at your accommodation.",
  },
  {
    name: "Mountain Drop-Offs",
    type: "shuttle",
    price: "€50–70",
    duration: "1.5h",
    url: "https://www.mountaindropoffs.com",
    notes: "Reliable service throughout Chamonix region. Good communication.",
  },
  {
    name: "Chamonix Valley Transfers",
    type: "private",
    price: "€60–100+",
    duration: "1.5h",
    url: "https://www.chamonixvalleytransfers.com",
    notes: "Private transfers available. Also offers TMB baggage transfer service.",
  },
];

export const TRANSPORT_FROM_CHAMONIX: TransportOption[] = [
  {
    name: "FlixBus",
    type: "bus",
    price: "€19–25",
    duration: "1h 10m – 2h",
    url: "https://www.flixbus.com/bus-routes/bus-chamonix-mont-blanc-geneva-airport",
    notes: "Book return in advance. Check schedule for your specific date — last bus times vary.",
    recommended: true,
  },
  {
    name: "BlaBlaCar Bus",
    type: "bus",
    price: "€20–30",
    duration: "1.5–2h",
    url: "https://www.blablacar.com",
    notes: "Multiple daily departures to Geneva Airport.",
  },
  {
    name: "AlpyBus (Shared Shuttle)",
    type: "shuttle",
    price: "€40–60",
    duration: "1.5h",
    url: "https://www.alpybus.com",
    notes: "Picks up from your accommodation. Book well in advance for early morning departures.",
  },
];

// ── ATM Locations ───────────────────────────────────────────────────

export const ATM_LOCATIONS: ATMLocation[] = [
  {
    name: "Chamonix Town Center",
    town: "Chamonix",
    note: "Multiple ATMs from various banks. Best place to stock up on euros before hitting the trail.",
    mapsQuery: "ATM+Chamonix+Mont+Blanc+France",
  },
  {
    name: "Les Contamines (Credit Agricole & Banque Populaire)",
    town: "Les Contamines",
    note: "End of Stage 1. Two ATMs near the Tourist Office — a few minutes walk past it.",
    mapsQuery: "Credit+Agricole+Les+Contamines+Montjoie",
  },
  {
    name: "Courmayeur",
    town: "Courmayeur",
    note: "Many ATMs available in this Italian mountain town.",
    mapsQuery: "ATM+Courmayeur+Italy",
  },
  {
    name: "La Fouly (Switzerland)",
    town: "La Fouly",
    note: "One ATM in this small Swiss village. Card is widely accepted in Switzerland though.",
    mapsQuery: "ATM+La+Fouly+Switzerland",
  },
  {
    name: "Champex-Lac (Switzerland)",
    town: "Champex-Lac",
    note: "One ATM next to the only shop in town.",
    mapsQuery: "ATM+Champex-Lac+Switzerland",
  },
];

export const AVOID_ATM = {
  name: "Les Houches ATM (CA des Savoie)",
  reason: "Charges €6 fee for a €40 withdrawal on non-French cards. Get cash in Chamonix center instead.",
};

// ── Cash-Only Refuges ───────────────────────────────────────────────

export const CASH_ONLY_REFUGES: CashOnlyRefuge[] = [
  { name: "Refuge Plan Glacier", country: "France" },
  { name: "Refuge Miage", country: "France" },
  { name: "Auberge du Truc", country: "France" },
  { name: "Refuge Nant Borrant", country: "France" },
  { name: "Refuge de la Croix du Bonhomme", country: "France" },
  { name: "Auberge de la Nova", country: "France" },
  { name: "Refuge Mottets", country: "France" },
  { name: "Refugio Bertone", country: "Italy" },
  { name: "Refugio Bonatti", country: "Italy" },
  { name: "Refuge Les Grands", country: "France" },
  { name: "Refuge Bellachat", country: "France" },
  { name: "Refuge Lac Blanc (EUR only)", country: "France" },
  { name: "Alpage de la Peule (Swiss dairy farm)", country: "Switzerland" },
];

// ── Chamonix Essential Locations ────────────────────────────────────

export const CHAMONIX_ESSENTIALS: EssentialLocation[] = [
  {
    name: "Super U Chamonix",
    category: "supermarket",
    address: "117 Rue Joseph Vallot, 74400 Chamonix",
    hours: "Mon–Sat 8:30–19:30, Sun 9:00–12:30",
    mapsQuery: "Super+U+Chamonix+Mont+Blanc",
    note: "Main supermarket. Stock up on trail snacks here — much cheaper than refuges. Camping stove gas available.",
  },
  {
    name: "SPAR Chamonix",
    category: "supermarket",
    mapsQuery: "SPAR+Chamonix+Mont+Blanc",
    note: "Smaller but convenient for quick grabs.",
  },
  {
    name: "Decathlon City Chamonix",
    category: "gear",
    address: "19 Avenue Michel Croz, 74400 Chamonix",
    hours: "Mon–Sat 9:30–19:30, Sun 10:00–19:00",
    mapsQuery: "Decathlon+City+Chamonix",
    note: "Last-minute trekking poles, socks, rain gear, etc. Larger Mountain Store in Passy (15 min drive).",
  },
  {
    name: "Chamonix Tourist Office",
    category: "tourist-office",
    address: "85 Place du Triangle de l'Amitié, 74400 Chamonix",
    mapsQuery: "Office+de+Tourisme+Chamonix",
    note: "Maps, trail conditions, weather forecasts. Ask about the Carte d'Hôte (guest card) for bus discounts.",
  },
  {
    name: "Pharmacie Centrale",
    category: "pharmacy",
    mapsQuery: "Pharmacie+Chamonix+Mont+Blanc",
    note: "Blister treatment, sunscreen, first aid supplies. French pharmacies are excellent for hiking medical needs.",
  },
];

// ── eSIM Options ────────────────────────────────────────────────────

export const ESIM_OPTIONS: ESIMOption[] = [
  {
    name: "Airalo",
    price: "$5–15",
    data: "1–5 GB",
    url: "https://www.airalo.com",
    note: "Most popular travel eSIM. Easy setup via app. Europe-wide coverage.",
  },
  {
    name: "Holafly",
    price: "$19+ (5 days)",
    data: "Unlimited",
    url: "https://www.holafly.com",
    note: "Unlimited data plans. Great if you'll be using maps and streaming a lot.",
  },
  {
    name: "Orange Travel eSIM",
    price: "€10–20",
    data: "5–20 GB",
    url: "https://travel.orange.com",
    note: "Best mountain coverage in France. Orange is the dominant carrier in the Alps.",
  },
  {
    name: "Saily (by NordVPN)",
    price: "$4–12",
    data: "1–5 GB",
    url: "https://saily.com",
    note: "Reliable and affordable. Good reviews from long-term travelers.",
  },
];

// ── Pre-Trip Checklist ──────────────────────────────────────────────

export const PRE_TRIP_CHECKLIST: ChecklistItem[] = [
  // Before Flight
  { id: "passport", text: "Passport valid for 3+ months beyond return date", category: "before-flight" },
  { id: "esim", text: "Set up eSIM on phone (download profile on WiFi before leaving)", category: "before-flight" },
  { id: "flixbus", text: "Book FlixBus Geneva Airport → Chamonix (and return)", category: "before-flight" },
  { id: "offline-maps", text: "Download offline maps (Google Maps: Chamonix + TMB region)", category: "before-flight" },
  { id: "checkin", text: "Check in online 24 hours before flight", category: "before-flight" },
  { id: "notify-bank", text: "Notify bank/credit card of international travel (France, Italy, Switzerland)", category: "before-flight" },
  { id: "wise-card", text: "Consider Wise or Revolut card for best exchange rates (no foreign transaction fees)", category: "before-flight" },
  { id: "copies", text: "Save photo/scan of passport, insurance, and booking confirmations on phone", category: "before-flight" },
  { id: "charger", text: "Pack portable battery + EU plug adapter (Type C/E/F — round 2-pin)", category: "before-flight" },
  { id: "entertainment", text: "Download entertainment for 8-10 hour flight", category: "before-flight" },

  // At Airport
  { id: "arrive-early", text: "Arrive at US airport 3 hours before departure", category: "at-airport" },
  { id: "liquids", text: "Liquids in 3-1-1 bag (3.4oz containers, 1 quart bag)", category: "at-airport" },
  { id: "layers", text: "Wear loose layers (planes get cold) — hiking pants + hoodie works great", category: "at-airport" },
  { id: "water", text: "Bring empty water bottle (fill after security)", category: "at-airport" },
  { id: "neck-pillow", text: "Neck pillow + noise-cancelling earbuds for overnight flight", category: "at-airport" },

  // Chamonix Arrival
  { id: "atm-cash", text: "Withdraw €200–300 from ATM in Chamonix center (not Les Houches)", category: "chamonix-arrival" },
  { id: "carte-dhote", text: "Ask hotel for Carte d'Hôte (guest card) — discounts on local buses", category: "chamonix-arrival" },
  { id: "luggage-store", text: "Arrange luggage storage at hotel for extra bags during TMB", category: "chamonix-arrival" },
  { id: "supermarket", text: "Stock up on trail snacks at Super U (much cheaper than refuges)", category: "chamonix-arrival" },
  { id: "decathlon", text: "Last-minute gear check at Decathlon (trekking poles, socks, rain gear)", category: "chamonix-arrival" },

  // Pre-Hike
  { id: "weather", text: "Check weather forecast at Tourist Office or Chamonix Météo", category: "pre-hike" },
  { id: "charge-all", text: "Charge all devices + portable battery to 100%", category: "pre-hike" },
  { id: "test-gear", text: "Test all gear (headlamp, rain jacket, trekking poles)", category: "pre-hike" },
  { id: "pack-cash", text: "Distribute cash in multiple locations (wallet + ziplock in pack)", category: "pre-hike" },
  { id: "rest", text: "Get a good night's sleep — don't overdo the pre-hike day", category: "pre-hike" },
];

// ── Chamonix Activities ─────────────────────────────────────────────

export const CHAMONIX_ACTIVITIES: Activity[] = [
  {
    name: "Aiguille du Midi Cable Car",
    description: "Two-stage cable car whisks you to 12,605 ft (3,842m) in 20 minutes. Panoramic views across France, Italy, and Switzerland with Mont Blanc front and center. Try the \"Step Into the Void\" glass box if you dare.",
    duration: "2–3 hours",
    cost: "~€70 round trip",
    mapsQuery: "Aiguille+du+Midi+cable+car+Chamonix",
    tip: "Go early morning for clearest views and shortest lines.",
  },
  {
    name: "Mer de Glace & Ice Cave",
    description: "Take the Montenvers cog railway to France's largest glacier. Wander through a dazzling ice cave carved into the glacier. Small museum at the top covers glacier history and climate science.",
    duration: "2–3 hours",
    cost: "~€38 round trip",
    mapsQuery: "Montenvers+Mer+de+Glace+Chamonix",
  },
  {
    name: "Warm-Up Hike to Lac Blanc",
    description: "Turquoise alpine lake reflecting the Mont Blanc massif. Take the La Flégère lift to save elevation, then hike ~1.5h to the lake. Pack a picnic — one of the most photogenic spots in the Alps.",
    duration: "3–5 hours",
    mapsQuery: "Lac+Blanc+Chamonix",
    tip: "Great acclimatization hike. Don't overdo it the day before TMB starts.",
  },
  {
    name: "Wander Chamonix Village",
    description: "Cozy cafés, outdoor gear shops, local boutiques. Visit the Alpine Museum for mountaineering history. Grab a croissant and espresso on a terrace with glacier views.",
    duration: "1–2 hours",
    mapsQuery: "Chamonix+Mont+Blanc+center",
  },
  {
    name: "QC Terme Spa",
    description: "Thermal pools, saunas, and outdoor hot tubs with mountain views. Perfect for soothing pre-hike nerves and jet-lagged muscles.",
    duration: "2–4 hours",
    cost: "~€50–65",
    mapsQuery: "QC+Terme+Chamonix",
    tip: "Bring your own swimsuit and towel to save on rental fees.",
  },
  {
    name: "Paragliding Over the Valley",
    description: "Tandem flights launch from Plan de l'Aiguille or Planpraz. Soar above the valley tracing ridgelines and glaciers. Surprisingly peaceful and absolutely unforgettable.",
    duration: "1–2 hours",
    cost: "€100–150",
    mapsQuery: "paragliding+Chamonix",
    tip: "Book in advance during peak season. Weather dependent.",
  },
];

// ── International Travel Guide Steps ────────────────────────────────

export interface TravelStep {
  title: string;
  icon: string; // lucide icon name
  content: string;
  tips?: string[];
}

export const INTERNATIONAL_TRAVEL_STEPS: TravelStep[] = [
  {
    title: "Before You Leave Home",
    icon: "ClipboardCheck",
    content: "Make sure your passport is valid for at least 3 months beyond your return date. No visa is needed for US citizens visiting the Schengen zone (up to 90 days). Notify your bank and credit card companies that you'll be traveling in France, Italy, and Switzerland so they don't freeze your card.",
    tips: [
      "Take a photo of your passport info page and save it to your phone + email it to yourself",
      "Check if ETIAS pre-authorization is required (new EU system rolling out in 2026)",
      "Set up a Wise or Revolut card before you go — best exchange rates with no foreign transaction fees",
    ],
  },
  {
    title: "At the US Airport (3 Hours Early)",
    icon: "PlaneTakeoff",
    content: "Arrive 3 hours before your international flight. Check in online 24 hours before to save time. At the airport: check your bag at the airline counter, then head to TSA security. Liquids must be in containers 3.4oz or smaller, all fitting in one quart-size clear bag. Laptop comes out of your bag. Shoes come off.",
    tips: [
      "Wear slip-on shoes and avoid belts with big buckles — speeds up security",
      "Bring an empty water bottle and fill it after security",
      "Boarding usually starts 30–45 minutes before departure — be at the gate early",
      "Your boarding pass will show your gate number — screens throughout the airport show updates",
    ],
  },
  {
    title: "On the Plane (8–10 Hours)",
    icon: "Plane",
    content: "US to Geneva is typically an overnight flight (8–10 hours depending on your departure city). Most flights depart evening US time and arrive morning European time. Try to sleep on the plane to adjust to the 6–8 hour time difference.",
    tips: [
      "Wear loose, comfortable layers — planes get cold at altitude",
      "Drink lots of water (cabin air is very dry) and avoid too much alcohol",
      "Noise-cancelling earbuds + neck pillow make a huge difference",
      "Download movies/shows before boarding — WiFi on transatlantic flights is spotty and expensive",
      "Set your watch to European time when you board to start adjusting mentally",
    ],
  },
  {
    title: "Landing at Geneva Airport (GVA)",
    icon: "PlaneLanding",
    content: "Geneva Airport is compact and easy to navigate. Follow signs to Immigration/Passport Control after deplaning. Since October 2025, the EU uses the new EES (Entry/Exit System) — a biometric border system that replaces passport stamps.",
    tips: [
      "At self-service kiosks: scan your passport and answer basic questions",
      "Then see a border officer who takes your photo and fingerprints (one-time registration, stored 3 years)",
      "Immigration typically takes 15–30 minutes (can be longer with EES queues)",
      "Customs is usually instant — walk through the green \"Nothing to Declare\" lane",
      "Free WiFi is available throughout Geneva Airport",
    ],
  },
  {
    title: "Getting Your FlixBus to Chamonix",
    icon: "Bus",
    content: "After clearing customs, follow signs to the bus departure area outside Arrivals. Your FlixBus e-ticket is on your phone — just show it to the driver. The ride to Chamonix takes about 1–2 hours through beautiful scenery along Lake Geneva and into the Alps.",
    tips: [
      "Buses run roughly every hour — check your booking for exact time",
      "If your flight is delayed, FlixBus lets you change your booking",
      "The bus has free WiFi and power outlets — charge your phone on the ride",
      "Bus drops you at Chamonix Gare Routière (bus station) in the town center",
      "From there it's a short walk or taxi to most hotels",
    ],
  },
  {
    title: "Returning Home (Departure Day)",
    icon: "Luggage",
    content: "On your last day, take the FlixBus from Chamonix back to Geneva Airport. Allow at least 3.5 hours before your flight (2 hours for the bus + 1.5 hours for check-in, security, and EES exit registration). Book your return bus in advance.",
    tips: [
      "EES exit registration is required — budget extra time for biometric check",
      "Duty-free shopping is available after security at Geneva Airport",
      "Geneva Airport has good food options airside if you arrive early",
      "Consider a side trip to Annecy (gorgeous lake town, 1 hour from Chamonix) if you have an extra day",
    ],
  },
];

// ── Money Tips ──────────────────────────────────────────────────────

export const MONEY_TIPS = {
  currencies: [
    { country: "France", currency: "Euro (EUR)", symbol: "€" },
    { country: "Italy", currency: "Euro (EUR)", symbol: "€" },
    { country: "Switzerland", currency: "Swiss Franc (CHF)", symbol: "CHF" },
  ],
  keyFacts: [
    "Euro is king on the TMB. No need to carry Swiss Francs — EUR notes are accepted everywhere in Swiss TMB towns.",
    "Swiss shops accept EUR notes but give change in CHF. They do NOT accept EUR coins.",
    "Budget ~€25/day in cash for incidentals (if accommodation is pre-paid).",
    "Carry €200–300 total for a 10-day trek. Some hikers spent €50–60 over 7 days, others needed more.",
    "Switzerland is very card-friendly. France and Italy are mostly card-friendly but some refuges are cash-only.",
  ],
  scamAvoidance: [
    "NEVER exchange money at the airport — worst rates guaranteed. Use ATMs instead.",
    "When paying by card, ALWAYS choose to pay in the LOCAL currency (EUR or CHF), not USD. Declining the conversion (called Dynamic Currency Conversion / DCC) saves you 3–5%.",
    "Use bank ATMs (attached to a bank building), not standalone machines in tourist areas.",
    "Wise or Revolut cards give near-perfect exchange rates with zero foreign transaction fees.",
    "Avoid the Les Houches ATM (CA des Savoie) — charges €6 fee for a €40 withdrawal.",
  ],
};

// ── Annecy Side Trip ────────────────────────────────────────────────

export const ANNECY_SIDE_TRIP = {
  name: "Annecy",
  tagline: "The Venice of the Alps",
  description: "If you have an extra day before or after TMB, Annecy is a stunning lake town about 1 hour from Chamonix. Crystal-clear turquoise lake, medieval old town with canals, incredible bakeries, and cycling paths around the lake.",
  highlights: [
    "Cycle around Lac d'Annecy (flat, scenic 40km loop)",
    "Swim in the crystal-clear lake",
    "Wander the medieval old town and canals",
    "Try local Savoyard cuisine (tartiflette, raclette, fondue)",
    "Visit the Palais de l'Île (12th-century castle on an island)",
  ],
  transport: "Bus or train from Chamonix (~1 hour). Can also drive.",
  mapsQuery: "Annecy+France",
};


// ── Flight Data ─────────────────────────────────────────────

export interface FlightLeg {
  flightNumber: string;
  airline: string;
  operatedBy: string;
  aircraft: string;
  from: { code: string; city: string; terminal?: string };
  to: { code: string; city: string; terminal?: string };
  depart: { date: string; time: string }; // "Fri, Jul 24", "1:40 PM"
  arrive: { date: string; time: string };
  duration: string;
  seat: string;
  fareClass: string;
  layoverAfter?: string; // e.g. "1h 28m"
}

export interface FlightItinerary {
  direction: "outbound" | "return";
  label: string;
  route: string; // "OMA → MSP → CDG → GVA"
  departDate: string;
  arriveDate: string;
  totalDuration: string;
  legs: FlightLeg[];
}

export interface FlightBooking {
  confirmationCode: string;
  passenger: string;
  eTicket: string;
  ticketExpiration: string;
  destination: string;
  tripDates: string;
  itineraries: FlightItinerary[];
}

export const FLIGHT_BOOKING: FlightBooking = {
  confirmationCode: "F7THJM",
  passenger: "Ryan Alan Cook",
  eTicket: "#0067435618789",
  ticketExpiration: "April 21, 2027",
  destination: "Geneva, Switzerland",
  tripDates: "Jul 24 – Aug 5, 2026",
  itineraries: [
    {
      direction: "outbound",
      label: "Outbound",
      route: "OMA → MSP → CDG → GVA",
      departDate: "Fri, Jul 24",
      arriveDate: "Sat, Jul 25",
      totalDuration: "17h 10m",
      legs: [
        {
          flightNumber: "DL3848",
          airline: "Delta",
          operatedBy: "SkyWest DBA Delta Connection",
          aircraft: "Embraer 175 (Enhanced Winglets)",
          from: { code: "OMA", city: "Omaha, NE", terminal: "TBD" },
          to: { code: "MSP", city: "Minneapolis/St Paul, MN", terminal: "Terminal 1" },
          depart: { date: "Fri, Jul 24", time: "1:40 PM" },
          arrive: { date: "Fri, Jul 24", time: "3:02 PM" },
          duration: "1h 22m",
          seat: "12B",
          fareClass: "Main Classic (V)",
          layoverAfter: "1h 28m",
        },
        {
          flightNumber: "DL0152",
          airline: "Delta",
          operatedBy: "Delta Air Lines",
          aircraft: "Airbus A330-300",
          from: { code: "MSP", city: "Minneapolis/St Paul, MN", terminal: "Terminal 1" },
          to: { code: "CDG", city: "Paris-De Gaulle, France", terminal: "Aerogare 2 Term E" },
          depart: { date: "Fri, Jul 24", time: "4:30 PM" },
          arrive: { date: "Sat, Jul 25", time: "7:55 AM" },
          duration: "8h 25m",
          seat: "43H",
          fareClass: "Main Classic (V)",
          layoverAfter: "4h 45m",
        },
        {
          flightNumber: "DL8528",
          airline: "Delta",
          operatedBy: "Air France",
          aircraft: "Airbus A318",
          from: { code: "CDG", city: "Paris-De Gaulle, France", terminal: "Aerogare 2 Term F" },
          to: { code: "GVA", city: "Geneva, Switzerland", terminal: "Terminal 1" },
          depart: { date: "Sat, Jul 25", time: "12:40 PM" },
          arrive: { date: "Sat, Jul 25", time: "1:50 PM" },
          duration: "1h 10m",
          seat: "20C",
          fareClass: "Economy (V)",
        },
      ],
    },
    {
      direction: "return",
      label: "Return",
      route: "GVA → AMS → ATL → OMA",
      departDate: "Wed, Aug 5",
      arriveDate: "Wed, Aug 5",
      totalDuration: "16h 49m",
      legs: [
        {
          flightNumber: "KL1934",
          airline: "KLM",
          operatedBy: "KLM Cityhopper",
          aircraft: "Embraer 190",
          from: { code: "GVA", city: "Geneva, Switzerland", terminal: "Terminal 1" },
          to: { code: "AMS", city: "Amsterdam, Netherlands" },
          depart: { date: "Wed, Aug 5", time: "2:10 PM" },
          arrive: { date: "Wed, Aug 5", time: "3:45 PM" },
          duration: "1h 35m",
          seat: "—",
          fareClass: "Euro Economy (N)",
          layoverAfter: "1h 20m",
        },
        {
          flightNumber: "DL9374",
          airline: "KLM",
          operatedBy: "KLM",
          aircraft: "Boeing 777-300ER",
          from: { code: "AMS", city: "Amsterdam, Netherlands" },
          to: { code: "ATL", city: "Atlanta, GA", terminal: "International Term" },
          depart: { date: "Wed, Aug 5", time: "5:05 PM" },
          arrive: { date: "Wed, Aug 5", time: "8:25 PM" },
          duration: "9h 20m",
          seat: "50C",
          fareClass: "Economy (T)",
          layoverAfter: "2h 15m",
        },
        {
          flightNumber: "DL2010",
          airline: "Delta",
          operatedBy: "Delta Air Lines",
          aircraft: "Airbus A319",
          from: { code: "ATL", city: "Atlanta, GA", terminal: "Domestic Term-South" },
          to: { code: "OMA", city: "Omaha, NE" },
          depart: { date: "Wed, Aug 5", time: "10:40 PM" },
          arrive: { date: "Wed, Aug 5", time: "11:59 PM" },
          duration: "2h 19m",
          seat: "15D",
          fareClass: "Main Classic (T)",
        },
      ],
    },
  ],
};


// ── Hotel Bookings ─────────────────────────────────────────

export interface HotelBooking {
  name: string;
  location: string; // e.g. "Les Houches" or "Chamonix"
  address: string;
  phone: string;
  confirmationNumber: string;
  bookedVia: string; // "Hotels.com", "Priceline"
  tripId?: string;
  checkIn: { date: string; day: string; time: string }; // "Jul 25", "Sat", "3:00 PM"
  checkOut: { date: string; day: string; time: string };
  mapsQuery: string;
  stars?: number;
  notes?: string[];
  luggageStorage?: {
    available: boolean;
    details: string;
  };
}

export const HOTEL_BOOKINGS: HotelBooking[] = [
  {
    name: "RockyPop Chamonix – Les Houches",
    location: "Les Houches",
    address: "1476 Avenue des Alpages, Les Houches, 74310 France",
    phone: "+33 4 85 30 00 00",
    confirmationNumber: "72072638873766",
    bookedVia: "Hotels.com",
    tripId: "72072638873766",
    checkIn: { date: "Jul 25", day: "Sat", time: "3:00 PM" },
    checkOut: { date: "Jul 26", day: "Sun", time: "11:00 AM" },
    mapsQuery: "RockyPop+Hotel+Les+Houches+Chamonix",
    stars: 3,
    notes: [
      "Located in Les Houches, ~6 km from Chamonix center",
      "Fun, modern hotel with pop-art style and game rooms",
      "Luggage storage available but may charge a small fee (€5/day reported)",
      "Close to Les Houches TMB trailhead — convenient if starting from there",
    ],
    luggageStorage: {
      available: true,
      details: "Available but may charge ~€5/day. Some reports say they won't store luggage without a return booking.",
    },
  },
  {
    name: "Hôtel Les Aiglons Chamonix",
    location: "Chamonix",
    address: "270 Avenue Courmayeur, Chamonix, 74400 France",
    phone: "+33 4 50 55 90 93",
    confirmationNumber: "5081305984",
    bookedVia: "Priceline",
    tripId: "323-532-073-95",
    checkIn: { date: "Aug 4", day: "Tue", time: "4:00 PM" },
    checkOut: { date: "Aug 5", day: "Wed", time: "12:00 PM" },
    mapsQuery: "Hotel+Les+Aiglons+Chamonix+Mont+Blanc",
    stars: 4,
    notes: [
      "4-star hotel adjacent to Chamonix Sud bus station",
      "Spa, pool, concierge, 24-hour front desk",
      "Perfect location for catching the FlixBus to Geneva Airport on departure day",
    ],
    luggageStorage: {
      available: true,
      details: "Free luggage storage for guests with a booking. Drop off a bag with fresh clothes before your TMB hike — they'll hold it until your check-in on Aug 4. Call ahead at +33 4 50 55 90 93 and reference confirmation #5081305984.",
    },
  },
];

// ── Bus Transfer Bookings (CONFIRMED) ─────────────────────────────────

export interface BusBooking {
  direction: "outbound" | "return";
  label: string;
  date: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  carrier: string;
  busNumber: string;
  seat: string;
  passenger: string;
  bookingNumber: string;
  context: string;
  status: "confirmed";
}

export const BUS_BOOKINGS: BusBooking[] = [
  {
    direction: "outbound",
    label: "Geneva Airport → Chamonix",
    date: "Fri, Jul 25",
    from: "Geneva Airport (Bus Station)",
    to: "Chamonix Centre (Bus Station)",
    departTime: "3:30 PM",
    arriveTime: "5:00 PM",
    duration: "1h 30m",
    carrier: "Alpine Fleet (via FlixBus)",
    busNumber: "CDE3294",
    seat: "Unassigned",
    passenger: "Ryan Cook",
    bookingNumber: "3354943817",
    context: "Flight lands 1:50 PM — 1h 40m buffer for customs + baggage.",
    status: "confirmed",
  },
  {
    direction: "return",
    label: "Chamonix → Geneva Airport",
    date: "Tue, Aug 5",
    from: "Chamonix Centre (Bus Station)",
    to: "Geneva Airport (Bus Station)",
    departTime: "9:30 AM",
    arriveTime: "11:00 AM",
    duration: "1h 30m",
    carrier: "Alpine Fleet (via FlixBus)",
    busNumber: "CDE3294",
    seat: "Unassigned",
    passenger: "Ryan Cook",
    bookingNumber: "3354944548",
    context: "Arrive GVA 11:00 AM — 3h 10m before flight departs 2:10 PM.",
    status: "confirmed",
  },
];
