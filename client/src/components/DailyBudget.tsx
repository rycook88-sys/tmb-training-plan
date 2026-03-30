import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Coffee,
  Beer,
  UtensilsCrossed,
  MapPin,
  Bus,
  CableCar,
  Wallet,
  Info,
  Check,
  X,
} from "lucide-react";

/* ── types ── */
interface FoodStop {
  name: string;
  type: "refuge" | "restaurant" | "cafe" | "supermarket" | "food-truck";
  description: string;
  mustTry?: string;
  priceRange: string; // e.g. "€10-15"
  payment: "card" | "cash" | "both";
  highlight?: boolean; // "don't miss" stop
}

interface DayBudget {
  day: number;
  label: string;
  from: string;
  to: string;
  country: "france" | "italy" | "switzerland";
  currency: "EUR" | "CHF";
  sleepElevation: number; // meters
  foodStops: FoodStop[];
  transportCost?: { item: string; price: string };
  estimatedLow: number;
  estimatedHigh: number;
  notes?: string;
}

/* ── data ── */
const DAYS: DayBudget[] = [
  {
    day: 1,
    label: "Rest Day",
    from: "Arrive Chamonix",
    to: "RockyPop Hotel",
    country: "france",
    currency: "EUR",
    sleepElevation: 1008,
    foodStops: [
      {
        name: "Cool Cats Hot Dogs",
        type: "restaurant",
        description: "Casual gourmet hot dogs in Chamonix",
        priceRange: "€8-12",
        payment: "card",
      },
      {
        name: "Big Mountain Brewing Co.",
        type: "restaurant",
        description: "Local craft beer & pub food",
        mustTry: "Local craft beer flight",
        priceRange: "€12-20",
        payment: "card",
        highlight: true,
      },
      {
        name: "Chamonix Supermarket",
        type: "supermarket",
        description: "Stock up on trail snacks, baguettes, cheese",
        priceRange: "€10-20",
        payment: "card",
      },
    ],
    estimatedLow: 25,
    estimatedHigh: 45,
    notes: "Explore Les Houches or take the bus to Chamonix. Stock up on snacks for the first few days.",
  },
  {
    day: 2,
    label: "Day 2",
    from: "RockyPop",
    to: "Gîte Le Pontet",
    country: "france",
    currency: "EUR",
    sleepElevation: 1150,
    foodStops: [
      {
        name: "Col de Voza",
        type: "refuge",
        description: "Mountain refuge with terrace views",
        mustTry: "Blueberry pie — best on the whole trail!",
        priceRange: "€8-15",
        payment: "card",
        highlight: true,
      },
      {
        name: "Refuge de Miage",
        type: "refuge",
        description: "Famous for enormous omelettes & pie",
        mustTry: "Giant omelette or blueberry tart",
        priceRange: "€10-18",
        payment: "cash",
        highlight: true,
      },
      {
        name: "Les Contamines Supermarket",
        type: "supermarket",
        description: "Last supermarket before remote sections",
        priceRange: "€5-15",
        payment: "card",
      },
    ],
    estimatedLow: 15,
    estimatedHigh: 30,
    notes: "Les Contamines has a supermarket — good restock point. Refuge de Miage is cash-only.",
  },
  {
    day: 3,
    label: "Day 3 (Bus)",
    from: "Gîte Le Pontet",
    to: "Hotel Base Camp Lodge",
    country: "france",
    currency: "EUR",
    sleepElevation: 1549,
    foodStops: [
      {
        name: "Refuge Nant-Borrant",
        type: "refuge",
        description: "Lunch stop on trail before Les Chapieux",
        priceRange: "€10-15",
        payment: "cash",
      },
      {
        name: "Le Relais Montagnard",
        type: "restaurant",
        description: "Pizzeria & camp store at Les Chapieux",
        mustTry: "Pizza (from 6pm) — hikers rave about it. Pre-made sandwiches also excellent.",
        priceRange: "€12-20",
        payment: "both",
        highlight: true,
      },
    ],
    transportCost: { item: "Bus (Les Chapieux shuttle)", price: "€4" },
    estimatedLow: 20,
    estimatedHigh: 35,
    notes: "Bus day. Le Relais Montagnard pizza is legendary — order early, they sell out.",
  },
  {
    day: 4,
    label: "Day 4",
    from: "Base Camp Lodge",
    to: "Rifugio Elisabetta",
    country: "france",
    currency: "EUR",
    sleepElevation: 2197,
    foodStops: [
      {
        name: "Chambres du Soleil",
        type: "refuge",
        description: "Lunch near Les Chapieux before the climb",
        priceRange: "€10-15",
        payment: "cash",
      },
      {
        name: "Refuge des Mottets",
        type: "refuge",
        description: "Last French refuge before Col de la Seigne",
        priceRange: "€8-12",
        payment: "cash",
      },
    ],
    estimatedLow: 12,
    estimatedHigh: 25,
    notes: "Remote day crossing into Italy. Carry snacks — long gaps between stops. Water at Mottets.",
  },
  {
    day: 5,
    label: "Day 5",
    from: "Rifugio Elisabetta",
    to: "Rifugio Maison Vieille",
    country: "italy",
    currency: "EUR",
    sleepElevation: 1956,
    foodStops: [
      {
        name: "Cabane du Combal",
        type: "refuge",
        description: "Beautiful setting, great food",
        mustTry: "Highly rated by hikers — one of the best refuges on the trail",
        priceRange: "€10-18",
        payment: "cash",
        highlight: true,
      },
      {
        name: "Maison Vieille",
        type: "refuge",
        description: "Beer stop with views, may not serve food outside hours",
        priceRange: "€5-8",
        payment: "card",
      },
    ],
    estimatedLow: 12,
    estimatedHigh: 22,
    notes: "Cabane du Combal is a don't-miss stop. Maison Vieille accepts cards.",
  },
  {
    day: 6,
    label: "Day 6 (Town)",
    from: "Maison Vieille",
    to: "Rifugio Chapy",
    country: "italy",
    currency: "EUR",
    sleepElevation: 2000,
    foodStops: [
      {
        name: "Courmayeur Restaurants",
        type: "restaurant",
        description: "Town day — La Remisa (pizza/pasta), many options",
        mustTry: "La Remisa pizza or pasta. Italian gelato!",
        priceRange: "€15-30",
        payment: "card",
        highlight: true,
      },
      {
        name: "Courmayeur Supermarket",
        type: "supermarket",
        description: "Major restock point — last big town for a while",
        priceRange: "€10-20",
        payment: "card",
      },
      {
        name: "Rifugio Bertone",
        type: "refuge",
        description: "Cappuccino & pie with stunning views",
        mustTry: "Cappuccino + pie after the climb from Courmayeur",
        priceRange: "€8-12",
        payment: "cash",
      },
    ],
    estimatedLow: 30,
    estimatedHigh: 50,
    notes: "Courmayeur is a full town — ATM, supermarket, restaurants. Bertone is cash-only. Splurge day!",
  },
  {
    day: 7,
    label: "Day 7",
    from: "Rifugio Chapy",
    to: "Gîte La Peule",
    country: "italy",
    currency: "EUR",
    sleepElevation: 1990,
    foodStops: [
      {
        name: "Rifugio Bonatti",
        type: "refuge",
        description: "Iconic refuge with Mont Blanc views",
        mustTry: "Blueberry pie + aperol spritz — legendary combo",
        priceRange: "€10-18",
        payment: "card",
        highlight: true,
      },
      {
        name: "Chalet Val Ferret",
        type: "refuge",
        description: "Excellent food, small restaurant open to non-guests",
        mustTry: "Polenta & sausage, lasagna, or carpaccio salad",
        priceRange: "€12-25",
        payment: "card",
      },
      {
        name: "Rifugio Elena",
        type: "refuge",
        description: "Last Italian refuge before Switzerland",
        mustTry: "Hot chocolate — life-saving in cold weather",
        priceRange: "€5-10",
        payment: "card",
      },
      {
        name: "Refuge La Peule",
        type: "refuge",
        description: "First Swiss stop — cappuccino, soup, bread & cheese",
        priceRange: "€8-15",
        payment: "cash",
      },
    ],
    estimatedLow: 20,
    estimatedHigh: 40,
    notes: "Great food day. Bonatti and Val Ferret both accept cards. La Peule is cash-only.",
  },
  {
    day: 8,
    label: "Day 8 (🇨🇭)",
    from: "Gîte La Peule",
    to: "Relais D'Arpette",
    country: "switzerland",
    currency: "CHF",
    sleepElevation: 1627,
    foodStops: [
      {
        name: "Mont Fromage Food Truck",
        type: "food-truck",
        description: "Food truck in La Fouly — fries, cheese, beer",
        mustTry: "Fries & local beer",
        priceRange: "CHF 10-18",
        payment: "cash",
        highlight: true,
      },
      {
        name: "La Fouly Supermarket",
        type: "supermarket",
        description: "Small supermarket for restocking",
        priceRange: "CHF 10-20",
        payment: "card",
      },
      {
        name: "La Kabana Crêpes",
        type: "cafe",
        description: "Creperie on the trail — savory & sweet",
        mustTry: "Savory crêpe + cappuccino",
        priceRange: "CHF 12-20",
        payment: "cash",
        highlight: true,
      },
      {
        name: "Le Cabanon (Champex Lac)",
        type: "restaurant",
        description: "Swiss restaurant in charming lakeside village",
        mustTry: "Swiss rösti — incredible!",
        priceRange: "CHF 18-30",
        payment: "card",
      },
    ],
    estimatedLow: 35,
    estimatedHigh: 55,
    notes: "Switzerland is 20-30% pricier. La Fouly has an ATM for CHF. Many spots cash-only.",
  },
  {
    day: 9,
    label: "Day 9 (🇨🇭)",
    from: "Relais D'Arpette",
    to: "Auberge Mont Blanc",
    country: "switzerland",
    currency: "CHF",
    sleepElevation: 1370,
    foodStops: [
      {
        name: "Alpage de Bovine",
        type: "refuge",
        description: "Mountain buvette with soup, cake & beer",
        mustTry: "Soup + chocolate cake",
        priceRange: "CHF 12-20",
        payment: "cash",
        highlight: true,
      },
      {
        name: "Hôtel du Col de la Forclaz",
        type: "restaurant",
        description: "Beer, fries, burgers at the pass",
        mustTry: "Burger — hikers next to you will make you jealous",
        priceRange: "CHF 15-25",
        payment: "card",
      },
    ],
    estimatedLow: 25,
    estimatedHigh: 40,
    notes: "Last Swiss day. Bovine is cash-only. Forclaz accepts cards.",
  },
  {
    day: 10,
    label: "Day 10",
    from: "Auberge Mont Blanc",
    to: "Gîte Grassonnet",
    country: "france",
    currency: "EUR",
    sleepElevation: 1820,
    foodStops: [
      {
        name: "Refuge du Col de Balme",
        type: "refuge",
        description: "Refuge at the Swiss-French border pass",
        mustTry: "Cappuccino + brownies — 'best brownies ever' per hikers",
        priceRange: "€8-15",
        payment: "both",
        highlight: true,
      },
    ],
    estimatedLow: 10,
    estimatedHigh: 20,
    notes: "Back in France/EUR. Fewer food stops this day — carry snacks from breakfast.",
  },
  {
    day: 11,
    label: "Day 11 (Final)",
    from: "Grassonnet",
    to: "Planpraz → Chamonix",
    country: "france",
    currency: "EUR",
    sleepElevation: 1035,
    foodStops: [
      {
        name: "Refuge du Lac Blanc",
        type: "refuge",
        description: "Stunning lake setting for lunch",
        priceRange: "€12-20",
        payment: "cash",
      },
      {
        name: "La Bergerie du Plan Praz",
        type: "restaurant",
        description: "Restaurant near Planpraz cable car",
        priceRange: "€12-25",
        payment: "card",
      },
      {
        name: "Le Brévent Panoramic",
        type: "restaurant",
        description: "Panoramic restaurant at the summit",
        mustTry: "Celebration meal with Mont Blanc views!",
        priceRange: "€20-35",
        payment: "card",
        highlight: true,
      },
    ],
    transportCost: { item: "Planpraz Cable Car", price: "€18" },
    estimatedLow: 30,
    estimatedHigh: 55,
    notes: "Celebration day! Treat yourself at Le Brévent Panoramic before riding the cable car down.",
  },
];

const COUNTRY_FLAG: Record<string, string> = {
  france: "🇫🇷",
  italy: "🇮🇹",
  switzerland: "🇨🇭",
};

const PAYMENT_ICON: Record<string, { icon: typeof CreditCard; label: string; color: string }> = {
  card: { icon: CreditCard, label: "Card OK", color: "text-green-400" },
  cash: { icon: Banknote, label: "Cash Only", color: "text-amber-400" },
  both: { icon: Wallet, label: "Card or Cash", color: "text-blue-400" },
};

const STOP_ICON: Record<string, typeof Coffee> = {
  refuge: UtensilsCrossed,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  supermarket: MapPin,
  "food-truck": Beer,
};

/* ── component ── */
export default function DailyBudget() {
  const [open, setOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const totals = useMemo(() => {
    let eurLow = 0, eurHigh = 0, chfLow = 0, chfHigh = 0;
    DAYS.forEach((d) => {
      if (d.currency === "EUR") {
        eurLow += d.estimatedLow;
        eurHigh += d.estimatedHigh;
      } else {
        chfLow += d.estimatedLow;
        chfHigh += d.estimatedHigh;
      }
      if (d.transportCost) {
        const price = parseInt(d.transportCost.price.replace(/[^0-9]/g, ""));
        if (d.currency === "EUR") { eurLow += price; eurHigh += price; }
        else { chfLow += price; chfHigh += price; }
      }
    });
    return { eurLow, eurHigh, chfLow, chfHigh };
  }, []);

  return (
    <section className="mb-6">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-xl px-5 py-4 hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-white text-lg">Daily Budget & Food Stops</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">
            €{totals.eurLow}–{totals.eurHigh} + CHF {totals.chfLow}–{totals.chfHigh}
          </span>
          {open ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* EUR total */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🇪🇺</span>
                <span className="font-medium text-white">Euros (9 days)</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                €{totals.eurLow}–{totals.eurHigh}
              </div>
              <p className="text-xs text-zinc-500 mt-1">France & Italy days</p>
            </div>
            {/* CHF total */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🇨🇭</span>
                <span className="font-medium text-white">Swiss Francs (2 days)</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                CHF {totals.chfLow}–{totals.chfHigh}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Switzerland days (20-30% pricier)</p>
            </div>
            {/* Credit card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Capital One Venture</span>
              </div>
              <div className="flex items-center gap-1 text-green-400 font-semibold">
                <Check className="w-4 h-4" /> No foreign transaction fees
              </div>
              <p className="text-xs text-zinc-500 mt-1">Use tap-to-pay wherever accepted. Carry cash for remote refuges.</p>
            </div>
          </div>

          {/* Cash recommendations */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5 text-amber-400" />
              <span className="font-medium text-white">Cash to Carry</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-400 font-medium">EUR Denominations:</span>
                <p className="text-zinc-300 mt-1">€200–300 in small bills: 10× €5, 8× €10, 4× €20. Avoid €50+. Keep coins for small purchases.</p>
              </div>
              <div>
                <span className="text-zinc-400 font-medium">CHF Denominations:</span>
                <p className="text-zinc-300 mt-1">CHF 80–100 in small bills: 2× CHF 10, 3× CHF 20. One CHF 50 max. Some places accept EUR at poor rate.</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-zinc-500">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>ATMs available in Chamonix (D1), Les Contamines (D2), Courmayeur (D6), La Fouly (D8), and Chamonix (D11).</span>
            </div>
          </div>

          {/* Day-by-day */}
          {DAYS.map((day) => {
            const isExpanded = expandedDay === day.day;
            const PayIcon = PAYMENT_ICON;
            return (
              <div key={day.day} className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{COUNTRY_FLAG[day.country]}</span>
                    <div className="text-left">
                      <span className="font-medium text-white">D{day.day}</span>
                      <span className="text-zinc-400 ml-2 text-sm">{day.from} → {day.to}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {day.transportCost && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        {day.transportCost.item.includes("Bus") ? <Bus className="w-3 h-3" /> : <CableCar className="w-3 h-3" />}
                        {day.transportCost.price}
                      </span>
                    )}
                    <span className="text-sm font-medium text-zinc-300">
                      {day.currency === "EUR" ? "€" : "CHF "}{day.estimatedLow}–{day.estimatedHigh}
                    </span>
                    {day.foodStops.some((s) => s.highlight) && (
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                        Don't miss
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {day.notes && (
                      <p className="text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3">
                        {day.notes}
                      </p>
                    )}

                    {day.foodStops.map((stop, i) => {
                      const StopIcon = STOP_ICON[stop.type] || UtensilsCrossed;
                      const pay = PAYMENT_ICON[stop.payment];
                      const PaymentIcon = pay.icon;
                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            stop.highlight
                              ? "bg-amber-500/10 border border-amber-500/20"
                              : "bg-zinc-800/40"
                          }`}
                        >
                          <StopIcon className={`w-4 h-4 mt-1 shrink-0 ${stop.highlight ? "text-amber-400" : "text-zinc-500"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white text-sm">{stop.name}</span>
                              <span className={`flex items-center gap-1 text-xs ${pay.color}`}>
                                <PaymentIcon className="w-3 h-3" />
                                {pay.label}
                              </span>
                              <span className="text-xs text-zinc-500">{stop.priceRange}</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{stop.description}</p>
                            {stop.mustTry && (
                              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                <span>⭐</span> {stop.mustTry}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {day.transportCost && (
                      <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg text-sm">
                        {day.transportCost.item.includes("Bus") ? (
                          <Bus className="w-4 h-4 text-blue-400" />
                        ) : (
                          <CableCar className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-blue-300">{day.transportCost.item}: {day.transportCost.price}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
