// TMB Water Sources — curated from OpenStreetMap, trail guides, Reddit, and hiker reports
// Prioritized: ~1 source every 3 miles for default view, with secondary sources for density slider
// Late July conditions noted for each source

export type WaterSourceType = "fountain" | "tap" | "trough" | "spring" | "stream" | "refuge-tap";
export type WaterPotability = "potable" | "filter-needed";

export interface WaterSource {
  id: string;
  name: string;
  day: number;
  mileAbs: number;       // absolute trail mile from start
  mileIn: number;        // miles into that day
  lat: number;
  lng: number;
  ele: number;           // elevation in feet
  type: WaterSourceType;
  potability: WaterPotability;
  description: string;   // what it looks like in late July
  julyCondition: string; // specific late July status
  priority: "primary" | "secondary"; // primary = every ~3mi, secondary = fill-in
  lastBeforeDry: boolean; // red outline warning
  dryStretchAhead?: string; // description of upcoming dry section
  distToNext: number;    // miles to next water source
}

// Day start absolute miles (from elevation profile accommodations)
const DAY_STARTS: Record<number, number> = {
  1: 0,
  2: 12.76,
  3: 22.93,
  4: 31.75,
  5: 38.01,
  6: 47.94,
  7: 62.23,
  8: 76.04,
  9: 85.53,
  10: 97.83,
};

export const WATER_SOURCES: WaterSource[] = [
  // ═══════════════════════════════════════════════════════════
  // DAY 1: Les Houches → Gîte Le Pontet (12.8 mi)
  // Good water availability — refuges and troughs throughout
  // ═══════════════════════════════════════════════════════════
  {
    id: "w1-01",
    name: "Les Houches Village Fountain",
    day: 1, mileAbs: 0.3, mileIn: 0.3,
    lat: 45.8901, lng: 6.7981,
    ele: 3400, type: "fountain", potability: "potable",
    description: "Stone fountain in the center of Les Houches village, near the church. Easy fill-up before the first big climb.",
    julyCondition: "Flowing year-round. Reliable in late July.",
    priority: "primary", lastBeforeDry: false, distToNext: 2.5,
  },
  {
    id: "w1-02",
    name: "Col de Voza Water Trough",
    day: 1, mileAbs: 2.8, mileIn: 2.8,
    lat: 45.8780, lng: 6.7626,
    ele: 5431, type: "trough", potability: "potable",
    description: "Wooden water trough near the Col de Voza refuge and cable car station. Cold mountain water piped from a spring above.",
    julyCondition: "Flowing strongly in late July. Snowmelt-fed, very cold.",
    priority: "primary", lastBeforeDry: false, distToNext: 2.2,
  },
  {
    id: "w1-03",
    name: "Bionnassay Stream Crossing",
    day: 1, mileAbs: 5.0, mileIn: 5.0,
    lat: 45.8580, lng: 6.7590,
    ele: 4800, type: "stream", potability: "filter-needed",
    description: "Glacial stream from the Bionnassay glacier. Fast-flowing and icy cold. Bridge crossing point.",
    julyCondition: "High flow in late July from glacier melt. Silty — filter required.",
    priority: "secondary", lastBeforeDry: false, distToNext: 2.8,
  },
  {
    id: "w1-04",
    name: "Refuge de Miage Tap",
    day: 1, mileAbs: 7.8, mileIn: 7.8,
    lat: 45.8392, lng: 6.7601,
    ele: 5122, type: "refuge-tap", potability: "potable",
    description: "Water tap at Refuge de Miage, down by the river in the direction of Le Truc (follow 'toilettes' signs). Famous for enormous omelettes.",
    julyCondition: "Always available during refuge operating hours (mid-June to mid-Sept).",
    priority: "primary", lastBeforeDry: false, distToNext: 3.1,
  },
  {
    id: "w1-05",
    name: "Les Contamines Village Fountain",
    day: 1, mileAbs: 10.9, mileIn: 10.9,
    lat: 45.8217, lng: 6.7272,
    ele: 3768, type: "fountain", potability: "potable",
    description: "Public fountain in Les Contamines-Montjoie village center. Multiple taps available near the church and supermarket.",
    julyCondition: "Year-round supply. Town water system.",
    priority: "primary", lastBeforeDry: false, distToNext: 1.6,
  },
  {
    id: "w1-06",
    name: "Les Contamines Cemetery Fountain",
    day: 1, mileAbs: 12.1, mileIn: 12.1,
    lat: 45.8160, lng: 6.7230,
    ele: 3840, type: "fountain", potability: "potable",
    description: "Small fountain near the cemetery on the trail out of Les Contamines. Easy to miss — look right.",
    julyCondition: "Reliable year-round.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.0,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 2: Les Contamines → Les Chapieux (10.2 mi)
  // Good water early, gets sparse after Col du Bonhomme
  // ═══════════════════════════════════════════════════════════
  {
    id: "w2-01",
    name: "Notre Dame de la Gorge Fountain",
    day: 2, mileAbs: 13.8, mileIn: 1.0,
    lat: 45.7950, lng: 6.7170,
    ele: 4034, type: "fountain", potability: "potable",
    description: "Two water points: one by the carpark toilet block, another across the bridge from the baroque church. Historic pilgrimage site.",
    julyCondition: "Flowing reliably. Popular stop for all TMB hikers.",
    priority: "primary", lastBeforeDry: false, distToNext: 1.6,
  },
  {
    id: "w2-02",
    name: "Refuge Nant Borrant Trough",
    day: 2, mileAbs: 15.4, mileIn: 2.6,
    lat: 45.7798, lng: 6.7143,
    ele: 5087, type: "trough", potability: "potable",
    description: "Water trough on the left of the trail, opposite the Alpinus chalet, just before reaching Refuge Nant Borrant. Good lunch stop.",
    julyCondition: "Spring-fed, flowing well in late July.",
    priority: "primary", lastBeforeDry: false, distToNext: 0.5,
  },
  {
    id: "w2-03",
    name: "Fontaine sous la Balme",
    day: 2, mileAbs: 15.9, mileIn: 3.1,
    lat: 45.7740, lng: 6.7090,
    ele: 5207, type: "fountain", potability: "potable",
    description: "Named fountain ('Fontaine sous la Balme') on the trail between Nant Borrant and Refuge de la Balme. OSM-verified.",
    julyCondition: "Spring-fed, reliable through summer.",
    priority: "secondary", lastBeforeDry: false, distToNext: 0.5,
  },
  {
    id: "w2-04",
    name: "Source du Bonhomme",
    day: 2, mileAbs: 16.4, mileIn: 3.6,
    lat: 45.7680, lng: 6.7020,
    ele: 5643, type: "spring", potability: "potable",
    description: "Named spring ('Source du Bonhomme') on the approach to Col du Bonhomme. Natural spring emerging from rocks.",
    julyCondition: "Flowing in late July. Can slow to a trickle in very dry years.",
    priority: "primary", lastBeforeDry: true,
    dryStretchAhead: "3.5 miles to Les Chapieux — no reliable water on the descent from Col du Bonhomme.",
    distToNext: 3.5,
  },
  {
    id: "w2-05",
    name: "Col du Bonhomme Alpine Stream",
    day: 2, mileAbs: 17.9, mileIn: 5.1,
    lat: 45.7530, lng: 6.7100,
    ele: 6838, type: "stream", potability: "filter-needed",
    description: "Small alpine stream near the col. Snowmelt-fed trickle crossing the trail.",
    julyCondition: "May be dry by late July in warm years. Unreliable — don't count on it.",
    priority: "secondary", lastBeforeDry: false, distToNext: 2.0,
  },
  {
    id: "w2-06",
    name: "Les Chapieux Village Tap",
    day: 2, mileAbs: 22.9, mileIn: 10.1,
    lat: 45.6970, lng: 6.7339,
    ele: 5225, type: "tap", potability: "potable",
    description: "Water tap in Les Chapieux hamlet, just as you arrive. Small settlement with two accommodation options and a basic shop.",
    julyCondition: "Town water. Always available.",
    priority: "primary", lastBeforeDry: false, distToNext: 0.1,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 3: Bourg St Maurice → Rifugio Elisabetta (8.8 mi)
  // Shuttle start, then long climb. Water at Mottets and Elisabetta.
  // ═══════════════════════════════════════════════════════════
  {
    id: "w3-01",
    name: "Les Chapieux Departure Fountain",
    day: 3, mileAbs: 23.0, mileIn: 0.1,
    lat: 45.6964, lng: 6.7336,
    ele: 5084, type: "fountain", potability: "potable",
    description: "Fountain at the edge of Les Chapieux, right where the trail heads toward Col de la Seigne. Last village water before the climb.",
    julyCondition: "Reliable year-round.",
    priority: "primary", lastBeforeDry: false, distToNext: 4.9,
  },
  {
    id: "w3-02",
    name: "Torrent des Glaciers Stream",
    day: 3, mileAbs: 25.5, mileIn: 2.6,
    lat: 45.7100, lng: 6.7500,
    ele: 5900, type: "stream", potability: "filter-needed",
    description: "Glacial stream crossing on the approach to Refuge des Mottets. Fast-flowing from snowmelt above.",
    julyCondition: "Good flow in late July. Milky glacial water — filter essential.",
    priority: "secondary", lastBeforeDry: false, distToNext: 2.4,
  },
  {
    id: "w3-03",
    name: "Refuge des Mottets Tap",
    day: 3, mileAbs: 27.9, mileIn: 5.0,
    lat: 45.7514, lng: 6.8069,
    ele: 6070, type: "refuge-tap", potability: "potable",
    description: "Last French refuge before Col de la Seigne and the Italian border. Outdoor tap available. Fill up here!",
    julyCondition: "Open and flowing mid-June to mid-September.",
    priority: "primary", lastBeforeDry: true,
    dryStretchAhead: "3.7 miles over Col de la Seigne to Rifugio Elisabetta. Exposed alpine pass with no water.",
    distToNext: 3.7,
  },
  {
    id: "w3-04",
    name: "Rifugio Elisabetta Fountain",
    day: 3, mileAbs: 31.6, mileIn: 8.7,
    lat: 45.7600, lng: 6.8450,
    ele: 7043, type: "fountain", potability: "potable",
    description: "Water stop just before Rifugio Elisabetta. Stone fountain with cold mountain water. Mentioned in multiple trail guides.",
    julyCondition: "Flowing well in late July. Spring-fed.",
    priority: "primary", lastBeforeDry: false, distToNext: 0.2,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 4: Rifugio Elisabetta → Rifugio Maison Vieille (6.3 mi)
  // Short day, good water at Combal and Maison Vieille
  // ═══════════════════════════════════════════════════════════
  {
    id: "w4-01",
    name: "Rifugio Elisabetta Outdoor Tap",
    day: 4, mileAbs: 31.8, mileIn: 0.1,
    lat: 45.7610, lng: 6.8460,
    ele: 7091, type: "refuge-tap", potability: "potable",
    description: "Outdoor water tap at Rifugio Elisabetta. Fill up before descending into Val Veny.",
    julyCondition: "Reliable during refuge season.",
    priority: "primary", lastBeforeDry: false, distToNext: 3.0,
  },
  {
    id: "w4-02",
    name: "Lac Combal Stream",
    day: 4, mileAbs: 33.5, mileIn: 1.8,
    lat: 45.7700, lng: 6.8600,
    ele: 6700, type: "stream", potability: "filter-needed",
    description: "Stream alongside Lac Combal in Val Veny. Beautiful glacial valley setting.",
    julyCondition: "Good flow from glacier melt. Slightly silty — filter recommended.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.3,
  },
  {
    id: "w4-03",
    name: "Cabane du Combal Tap",
    day: 4, mileAbs: 34.8, mileIn: 3.1,
    lat: 45.7764, lng: 6.8679,
    ele: 6560, type: "refuge-tap", potability: "potable",
    description: "Water at Cabane du Combal refuge. One of the highest-rated refuges for food quality. Beautiful Val Veny setting.",
    julyCondition: "Open and flowing. Popular lunch stop.",
    priority: "primary", lastBeforeDry: false, distToNext: 3.1,
  },
  {
    id: "w4-04",
    name: "Rifugio Maison Vieille Tap",
    day: 4, mileAbs: 37.9, mileIn: 6.2,
    lat: 45.7909, lng: 6.9313,
    ele: 6501, type: "refuge-tap", potability: "potable",
    description: "Water tap at Rifugio Maison Vieille. Beer stop with views before descent to Courmayeur.",
    julyCondition: "Available during refuge hours.",
    priority: "primary", lastBeforeDry: false, distToNext: 1.2,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 5: Maison Vieille → Rifugio Chapy (9.9 mi)
  // Excellent water through Courmayeur, then sparse on climb
  // ═══════════════════════════════════════════════════════════
  {
    id: "w5-01",
    name: "Courmayeur 1889 Water Trough",
    day: 5, mileAbs: 40.5, mileIn: 2.5,
    lat: 45.7960, lng: 6.9680,
    ele: 4010, type: "trough", potability: "potable",
    description: "Historic stone water trough dating to 1889, on the right side of the trail as you enter Courmayeur. One of the most beautiful troughs on the TMB.",
    julyCondition: "Flowing year-round. Historic landmark.",
    priority: "primary", lastBeforeDry: false, distToNext: 0.5,
  },
  {
    id: "w5-02",
    name: "Courmayeur Tourist Office Fountain",
    day: 5, mileAbs: 41.0, mileIn: 3.0,
    lat: 45.7966, lng: 6.9689,
    ele: 3891, type: "fountain", potability: "potable",
    description: "Public fountain near the Courmayeur tourist office. Town center — ATMs, supermarket, restaurants all nearby.",
    julyCondition: "Town water supply. Always available.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.0,
  },
  {
    id: "w5-03",
    name: "Courmayeur Supermarket Area Tap",
    day: 5, mileAbs: 42.0, mileIn: 4.0,
    lat: 45.8030, lng: 6.9650,
    ele: 4311, type: "tap", potability: "potable",
    description: "Water tap near the supermarket area in Courmayeur. Major restock point — last big town for a while.",
    julyCondition: "Town water. Always available.",
    priority: "primary", lastBeforeDry: false, distToNext: 1.8,
  },
  {
    id: "w5-04",
    name: "Rifugio Bertone Tap",
    day: 5, mileAbs: 43.8, mileIn: 5.8,
    lat: 45.8090, lng: 6.9785,
    ele: 6331, type: "refuge-tap", potability: "potable",
    description: "Water tap at Rifugio Bertone. Cappuccino & pie with stunning views after the steep climb from Courmayeur. Cash only!",
    julyCondition: "Available during refuge operating hours.",
    priority: "primary", lastBeforeDry: true,
    dryStretchAhead: "3.7 miles to Rifugio Bonatti. Exposed balcony trail — carry extra water on hot days.",
    distToNext: 3.7,
  },
  {
    id: "w5-05",
    name: "Rifugio Chapy Area Tap",
    day: 5, mileAbs: 47.5, mileIn: 9.5,
    lat: 45.8200, lng: 7.0100,
    ele: 4651, type: "tap", potability: "potable",
    description: "Water available near Rifugio Chapy Mont Blanc, your accommodation for the night.",
    julyCondition: "Reliable during refuge season.",
    priority: "primary", lastBeforeDry: false, distToNext: 2.5,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 6: Rifugio Chapy → Gîte La Peule (14.3 mi)
  // Longest day. Bonatti has water, then Col Ferret is exposed.
  // ═══════════════════════════════════════════════════════════
  {
    id: "w6-01",
    name: "Rifugio Bonatti Tap",
    day: 6, mileAbs: 50.5, mileIn: 2.6,
    lat: 45.8350, lng: 7.0350,
    ele: 6200, type: "refuge-tap", potability: "potable",
    description: "Water tap at the famous Rifugio Bonatti. Stunning Mont Blanc views from the terrace. One of the most iconic refuges on the TMB.",
    julyCondition: "Open and flowing mid-June to late September.",
    priority: "primary", lastBeforeDry: false, distToNext: 3.6,
  },
  {
    id: "w6-02",
    name: "Chalet Val Ferret Tap",
    day: 6, mileAbs: 54.1, mileIn: 6.2,
    lat: 45.8500, lng: 7.0500,
    ele: 6625, type: "refuge-tap", potability: "potable",
    description: "Water at Chalet Val Ferret, near the Arp Nouvaz bus stop. Last reliable water before the Grand Col Ferret climb.",
    julyCondition: "Available during operating hours.",
    priority: "primary", lastBeforeDry: true,
    dryStretchAhead: "4.4 miles over Grand Col Ferret (7,641 ft). Exposed alpine pass — carry 2L minimum.",
    distToNext: 4.4,
  },
  {
    id: "w6-03",
    name: "Grand Col Ferret Alpine Stream",
    day: 6, mileAbs: 57.2, mileIn: 9.3,
    lat: 45.8800, lng: 7.0700,
    ele: 5985, type: "stream", potability: "filter-needed",
    description: "Small alpine stream on the Swiss side of Grand Col Ferret. Snowmelt trickle crossing the trail during descent.",
    julyCondition: "Usually flowing in late July but can be a trickle. Unreliable in dry years.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.3,
  },
  {
    id: "w6-04",
    name: "Rifugio Elena Tap",
    day: 6, mileAbs: 58.5, mileIn: 10.6,
    lat: 45.8900, lng: 7.0750,
    ele: 6653, type: "refuge-tap", potability: "potable",
    description: "Water tap at Rifugio Elena on the Swiss side. Good refill point after the col crossing.",
    julyCondition: "Open mid-June to mid-September. Reliable.",
    priority: "primary", lastBeforeDry: false, distToNext: 3.7,
  },
  {
    id: "w6-05",
    name: "La Peule Area Spring",
    day: 6, mileAbs: 62.2, mileIn: 14.3,
    lat: 45.9100, lng: 7.0900,
    ele: 6910, type: "spring", potability: "potable",
    description: "Spring near Gîte Alpage de La Peule, your accommodation. Alpine pasture setting.",
    julyCondition: "Flowing in summer. Spring-fed from above.",
    priority: "primary", lastBeforeDry: false, distToNext: 3.3,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 7: La Peule → Relais D'Arpette (13.8 mi)
  // Swiss valley — good water through villages
  // ═══════════════════════════════════════════════════════════
  {
    id: "w7-01",
    name: "La Fouly Village Fountain",
    day: 7, mileAbs: 65.5, mileIn: 3.3,
    lat: 45.9300, lng: 7.0950,
    ele: 5324, type: "fountain", potability: "potable",
    description: "Public fountain in La Fouly village. Small Swiss village with basic services.",
    julyCondition: "Town water. Always available.",
    priority: "primary", lastBeforeDry: false, distToNext: 5.2,
  },
  {
    id: "w7-02",
    name: "Praz-de-Fort Fountain",
    day: 7, mileAbs: 70.7, mileIn: 8.5,
    lat: 45.9500, lng: 7.1000,
    ele: 3819, type: "fountain", potability: "potable",
    description: "Water fountain in the lovely Swiss village of Praz-de-Fort. Multiple fountains in the village center.",
    julyCondition: "Year-round Swiss village water supply.",
    priority: "primary", lastBeforeDry: false, distToNext: 0.6,
  },
  {
    id: "w7-03",
    name: "Les Arlaches Fountain",
    day: 7, mileAbs: 71.3, mileIn: 9.1,
    lat: 45.9530, lng: 7.1050,
    ele: 3714, type: "fountain", potability: "potable",
    description: "Village fountain in Les Arlaches. One of several Swiss villages the trail passes through in quick succession.",
    julyCondition: "Reliable year-round.",
    priority: "secondary", lastBeforeDry: false, distToNext: 2.2,
  },
  {
    id: "w7-04",
    name: "Champex-Lac Village Tap",
    day: 7, mileAbs: 73.5, mileIn: 11.3,
    lat: 45.9700, lng: 7.1150,
    ele: 4322, type: "tap", potability: "potable",
    description: "Water tap in Champex-Lac. Charming lakeside village. Multiple water points available.",
    julyCondition: "Town water. Always available.",
    priority: "primary", lastBeforeDry: false, distToNext: 2.5,
  },
  {
    id: "w7-05",
    name: "Relais D'Arpette Tap",
    day: 7, mileAbs: 76.0, mileIn: 13.8,
    lat: 45.9800, lng: 7.0800,
    ele: 5356, type: "refuge-tap", potability: "potable",
    description: "Water at Relais D'Arpette, your accommodation. Fill up well tonight — tomorrow's Bovine route has limited water early on.",
    julyCondition: "Reliable during refuge season.",
    priority: "primary", lastBeforeDry: false, distToNext: 1.6,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 8: Relais D'Arpette → Auberge Mont Blanc (9.5 mi)
  // Bovine route — water at Alpage Bovine and Col de la Forclaz
  // ═══════════════════════════════════════════════════════════
  {
    id: "w8-01",
    name: "Arpette Valley Spring",
    day: 8, mileAbs: 77.6, mileIn: 1.6,
    lat: 45.9750, lng: 7.0650,
    ele: 4642, type: "spring", potability: "potable",
    description: "Natural spring in the Arpette valley, shortly after leaving Relais D'Arpette.",
    julyCondition: "Usually flowing in late July. Spring-fed.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.1,
  },
  {
    id: "w8-02",
    name: "Alpage Bovine Buvette",
    day: 8, mileAbs: 78.7, mileIn: 2.7,
    lat: 45.9700, lng: 7.0500,
    ele: 4404, type: "tap", potability: "potable",
    description: "Mountain buvette (refreshment hut) at Alpage Bovine. Sells drinks and simple food. Water tap available.",
    julyCondition: "Open in summer season. Reliable water.",
    priority: "primary", lastBeforeDry: false, distToNext: 2.9,
  },
  {
    id: "w8-03",
    name: "Chalet du Glacier Tap",
    day: 8, mileAbs: 81.6, mileIn: 5.6,
    lat: 45.9600, lng: 7.0200,
    ele: 6484, type: "refuge-tap", potability: "potable",
    description: "Water at Chalet du Glacier on the descent from the Bovine. Mountain café with views of the Trient glacier.",
    julyCondition: "Open in summer. Sells water if tap is off.",
    priority: "primary", lastBeforeDry: false, distToNext: 1.1,
  },
  {
    id: "w8-04",
    name: "Col de la Forclaz Tap",
    day: 8, mileAbs: 82.7, mileIn: 6.7,
    lat: 45.9550, lng: 7.0100,
    ele: 6137, type: "tap", potability: "potable",
    description: "Water at the Col de la Forclaz hotel and basic shop. Good restock point.",
    julyCondition: "Hotel water. Always available.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.8,
  },
  {
    id: "w8-05",
    name: "Trient Village Fountain",
    day: 8, mileAbs: 84.5, mileIn: 8.5,
    lat: 45.9500, lng: 6.9900,
    ele: 5011, type: "fountain", potability: "potable",
    description: "Village fountain in Trient. Small Swiss village at the bottom of the valley.",
    julyCondition: "Year-round village water supply.",
    priority: "primary", lastBeforeDry: false, distToNext: 0.9,
  },
  {
    id: "w8-06",
    name: "Auberge Mont Blanc Tap",
    day: 8, mileAbs: 85.4, mileIn: 9.4,
    lat: 45.9480, lng: 6.9800,
    ele: 4310, type: "refuge-tap", potability: "potable",
    description: "Water at Auberge Mont Blanc, your accommodation for the night.",
    julyCondition: "Reliable during operating season.",
    priority: "primary", lastBeforeDry: false, distToNext: 0.5,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 9: Trient → Gîte Le Nouveau Grassonnet (12.3 mi)
  // Good water to Col de Balme, then gets sparse toward Argentière
  // ═══════════════════════════════════════════════════════════
  {
    id: "w9-01",
    name: "Le Peuty Tap",
    day: 9, mileAbs: 85.9, mileIn: 0.4,
    lat: 45.9470, lng: 6.9750,
    ele: 4272, type: "tap", potability: "potable",
    description: "Water at Le Peuty refuge and camping area. Small settlement at the far end of the Trient valley.",
    julyCondition: "Available during summer season.",
    priority: "secondary", lastBeforeDry: false, distToNext: 2.1,
  },
  {
    id: "w9-02",
    name: "Trient Valley Stream",
    day: 9, mileAbs: 88.0, mileIn: 2.5,
    lat: 45.9600, lng: 6.9600,
    ele: 6313, type: "stream", potability: "filter-needed",
    description: "Alpine stream on the climb to Col de Balme. Clear mountain water from snowmelt above.",
    julyCondition: "Usually flowing in late July. Can be reduced in very dry years.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.1,
  },
  {
    id: "w9-03",
    name: "Refuge du Col de Balme Tap",
    day: 9, mileAbs: 89.1, mileIn: 3.6,
    lat: 45.9700, lng: 6.9700,
    ele: 7150, type: "refuge-tap", potability: "potable",
    description: "Water at Refuge du Col de Balme. Stunning views of Mont Blanc return for the first time in several days. Last reliable water before a long stretch.",
    julyCondition: "Open mid-June to late September. Reliable.",
    priority: "primary", lastBeforeDry: true,
    dryStretchAhead: "4.7 miles to Tré-le-Champ/Argentière. Exposed descent — carry extra water.",
    distToNext: 4.7,
  },
  {
    id: "w9-04",
    name: "Argentière Village Fountain",
    day: 9, mileAbs: 94.0, mileIn: 8.5,
    lat: 45.9750, lng: 6.9300,
    ele: 4611, type: "fountain", potability: "potable",
    description: "Public fountain ('Fontaine') in Argentière village. Multiple water points in this Chamonix valley town.",
    julyCondition: "Town water. Year-round.",
    priority: "primary", lastBeforeDry: false, distToNext: 1.9,
  },
  {
    id: "w9-05",
    name: "Chamonix Valley Trail Fountain",
    day: 9, mileAbs: 95.9, mileIn: 10.4,
    lat: 45.9600, lng: 6.9100,
    ele: 4133, type: "fountain", potability: "potable",
    description: "Fountain along the Chamonix valley trail between Argentière and Les Praz.",
    julyCondition: "Reliable year-round.",
    priority: "secondary", lastBeforeDry: false, distToNext: 1.9,
  },
  {
    id: "w9-06",
    name: "Grassonnet Area Tap",
    day: 9, mileAbs: 97.8, mileIn: 12.3,
    lat: 45.9500, lng: 6.8900,
    ele: 3915, type: "tap", potability: "potable",
    description: "Water at Gîte Le Nouveau Grassonnet, your accommodation. Fill up well tonight — tomorrow has the driest section of the entire TMB.",
    julyCondition: "Reliable during operating season.",
    priority: "primary", lastBeforeDry: true,
    dryStretchAhead: "9.5 miles to Planpraz/Chamonix. Stages 10-11 are the DRIEST on the TMB. Refuge Lac Blanc has NO free water. Carry 2L+ minimum!",
    distToNext: 9.5,
  },

  // ═══════════════════════════════════════════════════════════
  // DAY 10: Grassonnet → Planpraz → Chamonix (10.5 mi)
  // THE DRIEST SECTION OF THE TMB — carry extra water!
  // ═══════════════════════════════════════════════════════════
  {
    id: "w10-01",
    name: "Lac Blanc Outlet Stream",
    day: 10, mileAbs: 102.8, mileIn: 5.0,
    lat: 45.9760, lng: 6.8870,
    ele: 7710, type: "stream", potability: "filter-needed",
    description: "Stream near Lac Blanc outlet. WARNING: Lac Blanc water is untreated snowmelt — can contain pathogens. Refuge Lac Blanc has NO free tap water and only accepts CASH (euros). Filter absolutely required.",
    julyCondition: "Water present but NOT potable without filter. Snowmelt pool — not controlled or treated.",
    priority: "primary", lastBeforeDry: false, distToNext: 2.2,
  },
  {
    id: "w10-02",
    name: "La Flégère Area Spring",
    day: 10, mileAbs: 105.0, mileIn: 7.2,
    lat: 45.9600, lng: 6.8700,
    ele: 6400, type: "spring", potability: "filter-needed",
    description: "Small spring near the La Flégère cable car area. Trickle emerging from rocks on the trail.",
    julyCondition: "May be flowing in late July. Unreliable — don't count on it.",
    priority: "secondary", lastBeforeDry: false, distToNext: 2.0,
  },
  {
    id: "w10-03",
    name: "La Bergerie du Plan Praz",
    day: 10, mileAbs: 107.3, mileIn: 9.5,
    lat: 45.9340, lng: 6.8530,
    ele: 6257, type: "refuge-tap", potability: "potable",
    description: "Restaurant near the Planpraz cable car station. First reliable potable water since Grassonnet. You can buy water or ask to refill.",
    julyCondition: "Open during summer season. Restaurant water.",
    priority: "primary", lastBeforeDry: false, distToNext: 2.0,
  },
  {
    id: "w10-04",
    name: "Chamonix Town Fountain",
    day: 10, mileAbs: 109.3, mileIn: 11.5,
    lat: 45.9230, lng: 6.8700,
    ele: 3728, type: "fountain", potability: "potable",
    description: "You made it! Public fountains throughout Chamonix. Celebrate with actual running water after the driest stretch of the TMB.",
    julyCondition: "Town water. Always available. You earned this.",
    priority: "primary", lastBeforeDry: false, distToNext: 0,
  },
];

// Pre-compute: total primary sources and total all sources
export const PRIMARY_SOURCES = WATER_SOURCES.filter(s => s.priority === "primary");
export const FILTERED_SOURCES = WATER_SOURCES.filter(s => s.potability === "filter-needed");
export const POTABLE_SOURCES = WATER_SOURCES.filter(s => s.potability === "potable");
export const DRY_STRETCH_WARNINGS = WATER_SOURCES.filter(s => s.lastBeforeDry);
