import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
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
  elevation: number; // meters
  country: "france" | "italy" | "switzerland";
  highC: [number, number]; // range [low, high]
  lowC: [number, number];
  rainChance: number; // percent
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
  france: "🇫🇷",
  italy: "🇮🇹",
  switzerland: "🇨🇭",
};

/* ── component ── */
export default function WeatherForecast() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-xl px-5 py-4 hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Thermometer className="w-5 h-5 text-orange-400" />
          <span className="font-semibold text-white text-lg">Weather Averages (Late July)</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">Historical averages per stage</span>
          {open ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* General note */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex items-start gap-3">
            <CloudLightning className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-zinc-400">
              <span className="text-white font-medium">Late July on the TMB:</span> Warm in valleys (68–80°F), cool at altitude (45–60°F), cold at passes and at night (32–45°F). Afternoon thunderstorms are common — plan to be below treeline by 2pm when possible. Rain gear every day.
            </div>
          </div>

          {/* Day cards */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs border-b border-zinc-800">
                  <th className="text-left py-2 px-3 font-medium">Day</th>
                  <th className="text-left py-2 px-3 font-medium">Location</th>
                  <th className="text-center py-2 px-3 font-medium">Elev</th>
                  <th className="text-center py-2 px-3 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <Sun className="w-3 h-3" /> High
                    </div>
                  </th>
                  <th className="text-center py-2 px-3 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <Wind className="w-3 h-3" /> Low
                    </div>
                  </th>
                  <th className="text-center py-2 px-3 font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <CloudRain className="w-3 h-3" /> Rain
                    </div>
                  </th>
                  <th className="text-left py-2 px-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {WEATHER.map((w) => {
                  const highF = [cToF(w.highC[0]), cToF(w.highC[1])];
                  const lowF = [cToF(w.lowC[0]), cToF(w.lowC[1])];
                  return (
                    <tr
                      key={w.day}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span>{COUNTRY_FLAG[w.country]}</span>
                          <span className="font-medium text-white">D{w.day}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-300">{w.location}</td>
                      <td className="py-3 px-3 text-center text-zinc-400">
                        {Math.round(w.elevation * 3.281)}ft
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-orange-400 font-medium">
                          {highF[0]}–{highF[1]}°F
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-blue-400 font-medium">
                          {lowF[0]}–{lowF[1]}°F
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            w.rainChance >= 45
                              ? "bg-blue-500/20 text-blue-300"
                              : w.rainChance >= 40
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {w.rainChance}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 text-xs max-w-[200px]">
                        {w.note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
