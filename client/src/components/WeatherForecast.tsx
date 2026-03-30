import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Thermometer,
  CloudRain,
  Sun,
  Wind,
  CloudLightning,
} from "lucide-react";

/* ── data ── */
interface DayWeather {
  day: number;
  location: string;
  elevation: number;
  country: "france" | "italy" | "switzerland";
  highC: [number, number];
  lowC: [number, number];
  rainChance: number;
  note: string;
}

const WEATHER: DayWeather[] = [
  {
    day: 1,
    location: "RockyPop, Les Houches",
    elevation: 1008,
    country: "france",
    highC: [20, 27],
    lowC: [10, 14],
    rainChance: 35,
    note: "Valley town. Warm days, cool evenings. Afternoon thunderstorms possible.",
  },
  {
    day: 2,
    location: "Gîte Le Pontet",
    elevation: 1150,
    country: "france",
    highC: [18, 25],
    lowC: [9, 13],
    rainChance: 35,
    note: "Low altitude, similar to valley. Sun hoodie weather during the day.",
  },
  {
    day: 3,
    location: "Hotel Base Camp Lodge",
    elevation: 1549,
    country: "france",
    highC: [15, 22],
    lowC: [7, 11],
    rainChance: 40,
    note: "Mid-altitude. Noticeably cooler than valley. Bus day — less exposure.",
  },
  {
    day: 4,
    location: "Rifugio Elisabetta",
    elevation: 2197,
    country: "france",
    highC: [10, 17],
    lowC: [2, 7],
    rainChance: 45,
    note: "High refuge. Cold at night — beanie and thermal needed. Wind at Col de la Seigne.",
  },
  {
    day: 5,
    location: "Rifugio Maison Vieille",
    elevation: 1956,
    country: "italy",
    highC: [12, 19],
    lowC: [4, 9],
    rainChance: 40,
    note: "Italian side often warmer. Afternoon thunderstorms common in the Aosta valley.",
  },
  {
    day: 6,
    location: "Rifugio Chapy",
    elevation: 2000,
    country: "italy",
    highC: [12, 18],
    lowC: [3, 8],
    rainChance: 40,
    note: "Courmayeur valley will be warm (25°C+), but the climb back up cools fast.",
  },
  {
    day: 7,
    location: "Gîte La Peule",
    elevation: 1990,
    country: "italy",
    highC: [11, 18],
    lowC: [3, 8],
    rainChance: 45,
    note: "Grand Col Ferret (2537m) will be cold and windy. Layer up for the pass.",
  },
  {
    day: 8,
    location: "Relais D'Arpette",
    elevation: 1627,
    country: "switzerland",
    highC: [14, 21],
    lowC: [6, 10],
    rainChance: 40,
    note: "Swiss valleys can be warm. Champex Lac is pleasant. Fenêtre d'Arpette variant is exposed.",
  },
  {
    day: 9,
    location: "Auberge Mont Blanc",
    elevation: 1370,
    country: "switzerland",
    highC: [16, 23],
    lowC: [8, 12],
    rainChance: 35,
    note: "Lower altitude, warmer. Road walking sections can be hot — hydrate well.",
  },
  {
    day: 10,
    location: "Gîte Grassonnet",
    elevation: 1820,
    country: "france",
    highC: [13, 20],
    lowC: [5, 9],
    rainChance: 40,
    note: "Col de Balme (2204m) can be foggy and cold. Back in France.",
  },
  {
    day: 11,
    location: "Planpraz → Chamonix",
    elevation: 2000,
    country: "france",
    highC: [12, 18],
    lowC: [4, 8],
    rainChance: 40,
    note: "Final day. Planpraz (2000m) will be cool. Chamonix valley warm for celebration.",
  },
];

function cToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

const COUNTRY_FLAG: Record<string, string> = {
  france: "\u{1F1EB}\u{1F1F7}",
  italy: "\u{1F1EE}\u{1F1F9}",
  switzerland: "\u{1F1E8}\u{1F1ED}",
};

/* ── component ── */
export default function WeatherForecast() {
  const [open, setOpen] = useState(false);

  return (
    <section className="container py-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <h2 className="text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)] font-mono flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-[var(--primary)]" /> Weather Averages (Late July)
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">Historical averages per stage</span>
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
              {/* General note */}
              <div className="border border-border bg-card p-4 flex items-start gap-3">
                <CloudLightning className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  <span className="text-foreground font-medium">Late July on the TMB:</span> Warm in valleys (68–80°F), cool at altitude (45–60°F), cold at passes and at night (32–45°F). Afternoon thunderstorms are common — plan to be below treeline by 2pm when possible. Rain gear every day.
                </p>
              </div>

              {/* Weather table */}
              <div className="border border-border bg-card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)] font-medium">Day</th>
                      <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)] font-medium">Location</th>
                      <th className="text-center py-2.5 px-3 text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)] font-medium">Elev</th>
                      <th className="text-center py-2.5 px-3 text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)] font-medium">
                        <span className="flex items-center justify-center gap-1">
                          <Sun className="w-3 h-3" /> High
                        </span>
                      </th>
                      <th className="text-center py-2.5 px-3 text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)] font-medium">
                        <span className="flex items-center justify-center gap-1">
                          <Wind className="w-3 h-3" /> Low
                        </span>
                      </th>
                      <th className="text-center py-2.5 px-3 text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)] font-medium">
                        <span className="flex items-center justify-center gap-1">
                          <CloudRain className="w-3 h-3" /> Rain
                        </span>
                      </th>
                      <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider font-mono text-[var(--muted-foreground)] font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WEATHER.map((w) => {
                      const highF = [cToF(w.highC[0]), cToF(w.highC[1])];
                      const lowF = [cToF(w.lowC[0]), cToF(w.lowC[1])];
                      return (
                        <tr
                          key={w.day}
                          className="border-b border-border last:border-b-0 hover:bg-[var(--secondary)] transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{COUNTRY_FLAG[w.country]}</span>
                              <span className="font-mono text-xs font-bold text-foreground">D{w.day}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-[var(--muted-foreground)]">{w.location}</td>
                          <td className="py-2.5 px-3 text-center text-xs font-mono text-[var(--muted-foreground)]">
                            {Math.round(w.elevation * 3.281)}ft
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-xs font-mono font-medium text-orange-400">
                              {highF[0]}–{highF[1]}°F
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-xs font-mono font-medium text-blue-400">
                              {lowF[0]}–{lowF[1]}°F
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono font-medium ${
                                w.rainChance >= 45
                                  ? "bg-blue-500/20 text-blue-300"
                                  : w.rainChance >= 40
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                              }`}
                            >
                              {w.rainChance}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-[var(--muted-foreground)] max-w-[200px]">
                            {w.note}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
