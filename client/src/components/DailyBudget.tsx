import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
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
} from "lucide-react";

/* ── types ── */
interface FoodStop {
  name: string;
  type: "refuge" | "restaurant" | "cafe" | "supermarket" | "food-truck";
  description: string;
  mustTry?: string;
  priceRange: string;
  payment: "card" | "cash" | "both";
  highlight?: boolean;
}

interface DayBudget {
  day: number;
  label: string;
  from: string;
  to: string;
  country: "france" | "italy" | "switzerland";
  currency: "EUR" | "CHF";
  sleepElevation: number;
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
    label: "Day 8 (CH)",
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
    label: "Day 9 (CH)",
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
        name: "Col de la Forclaz",
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
  france: "\u{1F1EB}\u{1F1F7}",
  italy: "\u{1F1EE}\u{1F1F9}",
  switzerland: "\u{1F1E8}\u{1F1ED}",
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
    <section className="container py-6">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-[var(--primary)]" /> Daily Budget & Food Stops
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            €{totals.eurLow}–{totals.eurHigh} + CHF {totals.chfLow}–{totals.chfHigh}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* EUR total */}
                <div className="border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{COUNTRY_FLAG.france}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[var(--muted-foreground)]">Euros (9 days)</span>
                  </div>
                  <div className="text-xl font-mono font-bold text-green-400">
                    €{totals.eurLow}–{totals.eurHigh}
                  </div>
                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-1">France & Italy days</p>
                </div>
                {/* CHF total */}
                <div className="border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{COUNTRY_FLAG.switzerland}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[var(--muted-foreground)]">Swiss Francs (2 days)</span>
                  </div>
                  <div className="text-xl font-mono font-bold text-red-400">
                    CHF {totals.chfLow}–{totals.chfHigh}
                  </div>
                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-1">Switzerland days (20-30% pricier)</p>
                </div>
                {/* Credit card */}
                <div className="border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[var(--muted-foreground)]">Capital One Venture</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-400 font-mono text-sm font-bold">
                    <Check className="w-3.5 h-3.5" /> No foreign transaction fees
                  </div>
                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-1">Use tap-to-pay wherever accepted. Carry cash for remote refuges.</p>
                </div>
              </div>

              {/* Cash recommendations */}
              <div className="border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-mono font-bold text-foreground">Cash to Carry</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[var(--primary)]">EUR Denominations</span>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">€200–300 in small bills: 10× €5, 8× €10, 4× €20. Avoid €50+. Keep coins for small purchases.</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[var(--primary)]">CHF Denominations</span>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">CHF 80–100 in small bills: 2× CHF 10, 3× CHF 20. One CHF 50 max. Some places accept EUR at poor rate.</p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-[10px] font-mono text-[var(--muted-foreground)]">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--primary)]" />
                  <span>ATMs available in Chamonix (D1), Les Contamines (D2), Courmayeur (D6), La Fouly (D8), and Chamonix (D11).</span>
                </div>
              </div>

              {/* Day-by-day */}
              <div className="border border-border bg-card divide-y divide-border">
                {DAYS.map((day) => {
                  const isExpanded = expandedDay === day.day;
                  return (
                    <div key={day.day}>
                      <button
                        onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--secondary)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{COUNTRY_FLAG[day.country]}</span>
                          <div className="text-left">
                            <span className="font-mono text-xs font-bold text-foreground">D{day.day}</span>
                            <span className="text-xs text-[var(--muted-foreground)] ml-2">{day.from} → {day.to}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {day.transportCost && (
                            <span className="text-[10px] font-mono bg-blue-500/15 text-blue-400 px-2 py-0.5 flex items-center gap-1">
                              {day.transportCost.item.includes("Bus") ? <Bus className="w-3 h-3" /> : <CableCar className="w-3 h-3" />}
                              {day.transportCost.price}
                            </span>
                          )}
                          <span className="text-xs font-mono font-medium text-[var(--muted-foreground)]">
                            {day.currency === "EUR" ? "€" : "CHF "}{day.estimatedLow}–{day.estimatedHigh}
                          </span>
                          {day.foodStops.some((s) => s.highlight) && (
                            <span className="text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5">
                              Don't miss
                            </span>
                          )}
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          </motion.div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              {day.notes && (
                                <p className="text-xs text-[var(--muted-foreground)] italic border-l-2 border-[var(--primary)]/30 pl-3">
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
                                    className={`flex items-start gap-3 p-3 ${
                                      stop.highlight
                                        ? "bg-amber-500/10 border border-amber-500/20"
                                        : "bg-[var(--secondary)]"
                                    }`}
                                  >
                                    <StopIcon className={`w-3.5 h-3.5 mt-1 shrink-0 ${stop.highlight ? "text-amber-400" : "text-[var(--muted-foreground)]"}`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-xs font-medium text-foreground">{stop.name}</span>
                                        <span className={`flex items-center gap-1 text-[10px] font-mono ${pay.color}`}>
                                          <PaymentIcon className="w-3 h-3" />
                                          {pay.label}
                                        </span>
                                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{stop.priceRange}</span>
                                      </div>
                                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{stop.description}</p>
                                      {stop.mustTry && (
                                        <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
                                          <span>⭐</span> {stop.mustTry}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {day.transportCost && (
                                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 text-xs font-mono">
                                  {day.transportCost.item.includes("Bus") ? (
                                    <Bus className="w-3.5 h-3.5 text-blue-400" />
                                  ) : (
                                    <CableCar className="w-3.5 h-3.5 text-blue-400" />
                                  )}
                                  <span className="text-blue-400">{day.transportCost.item}: {day.transportCost.price}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
