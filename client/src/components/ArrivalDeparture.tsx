import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, PlaneTakeoff, PlaneLanding, Bus, MapPin, CreditCard, Smartphone,
  ShoppingBag, CheckCircle2, Circle, ChevronDown, ChevronUp, ExternalLink,
  Clock, AlertTriangle, Landmark, Palmtree, ClipboardCheck, Luggage,
  Banknote, Wifi, Mountain, Star, Info, Building2,
} from "lucide-react";
import {
  TRANSPORT_TO_CHAMONIX, TRANSPORT_FROM_CHAMONIX,
  ATM_LOCATIONS, AVOID_ATM, CASH_ONLY_REFUGES,
  CHAMONIX_ESSENTIALS, ESIM_OPTIONS,
  PRE_TRIP_CHECKLIST, CHAMONIX_ACTIVITIES,
  INTERNATIONAL_TRAVEL_STEPS, MONEY_TIPS, ANNECY_SIDE_TRIP,
} from "@/lib/travel-data";
import type { ChecklistItem } from "@/lib/travel-data";

// ── Helpers ─────────────────────────────────────────────────

function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.replace(/\+/g, " "))}`;
}

// ── Collapsible Section ─────────────────────────────────────

function Section({
  icon, title, subtitle, accent, defaultOpen = false, children,
}: {
  icon: React.ReactNode; title: string; subtitle?: string;
  accent: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border-l-4 ${accent} bg-card/50`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-accent/30 transition-colors"
      >
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {subtitle && <div className="text-[10px] font-mono text-[var(--muted-foreground)] mt-0.5">{subtitle}</div>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── International Travel Guide ──────────────────────────────

function InternationalTravelGuide() {
  const iconMap: Record<string, React.ReactNode> = {
    ClipboardCheck: <ClipboardCheck className="w-5 h-5" />,
    PlaneTakeoff: <PlaneTakeoff className="w-5 h-5" />,
    Plane: <Plane className="w-5 h-5" />,
    PlaneLanding: <PlaneLanding className="w-5 h-5" />,
    Bus: <Bus className="w-5 h-5" />,
    Luggage: <Luggage className="w-5 h-5" />,
  };

  return (
    <div className="space-y-3">
      {INTERNATIONAL_TRAVEL_STEPS.map((step, i) => (
        <div key={i} className="border border-border bg-card/80 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] rounded-sm text-xs font-mono font-bold">
              {i + 1}
            </div>
            <span className="text-[var(--primary)]">{iconMap[step.icon] || <Info className="w-5 h-5" />}</span>
            <span className="text-sm font-semibold">{step.title}</span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-2">{step.content}</p>
          {step.tips && step.tips.length > 0 && (
            <div className="space-y-1 mt-2">
              {step.tips.map((tip, j) => (
                <div key={j} className="flex items-start gap-2 text-[11px] text-foreground/80">
                  <span className="text-[var(--primary)] mt-0.5 shrink-0">▸</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Flight Details ──────────────────────────────────────────
import FlightCard from "@/components/FlightCard";

// ── Hotel Bookings ─────────────────────────────────────────
import HotelCard from "@/components/HotelCard";

// ── Bus Transfers ─────────────────────────────────────────
import BusTransferCard from "@/components/BusTransferCard";

// ── Transport Section ───────────────────────────────────────

function TransportSection({ direction }: { direction: "to" | "from" }) {
  const options = direction === "to" ? TRANSPORT_TO_CHAMONIX : TRANSPORT_FROM_CHAMONIX;
  return (
    <div className="space-y-2">
      {direction === "to" && (
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          All buses depart from the bus stop area outside Geneva Airport Arrivals. The ride takes you along Lake Geneva and into the Alps.
        </p>
      )}
      {direction === "from" && (
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          Allow at least 3.5 hours before your flight (2h bus + 1.5h check-in/security/EES exit). Book return bus in advance.
        </p>
      )}
      {options.map((opt, i) => (
        <div key={i} className={`border ${opt.recommended ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-border bg-card/80"} p-3`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {opt.recommended && <Star className="w-3.5 h-3.5 text-[var(--primary)] fill-[var(--primary)]" />}
              <span className="text-sm font-semibold">{opt.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--secondary)] text-[var(--muted-foreground)] uppercase">{opt.type}</span>
            </div>
            <a
              href={opt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline flex items-center gap-1 text-[10px] font-mono"
            >
              Book <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[var(--muted-foreground)] font-mono mb-1">
            <span>{opt.price}</span>
            <span>·</span>
            <span>{opt.duration}</span>
          </div>
          <p className="text-[11px] text-foreground/70">{opt.notes}</p>
        </div>
      ))}
    </div>
  );
}

// ── Money & Currency ────────────────────────────────────────

function MoneySection() {
  return (
    <div className="space-y-4">
      {/* Currency Table */}
      <div className="border border-border bg-card/80 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--secondary)]">
              <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Country</th>
              <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Currency</th>
            </tr>
          </thead>
          <tbody>
            {MONEY_TIPS.currencies.map((c, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{c.country}</td>
                <td className="px-3 py-2 text-[var(--muted-foreground)]">{c.currency} ({c.symbol})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Facts */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-1">Key Facts</div>
        {MONEY_TIPS.keyFacts.map((fact, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
            <Banknote className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
            <span>{fact}</span>
          </div>
        ))}
      </div>

      {/* Scam Avoidance */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 mb-1">⚠ Avoid Getting Scammed</div>
        {MONEY_TIPS.scamAvoidance.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <span>{tip}</span>
          </div>
        ))}
      </div>

      {/* ATM Locations */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-2">ATM Locations on the TMB</div>
        <div className="space-y-2">
          {ATM_LOCATIONS.map((atm, i) => (
            <div key={i} className="flex items-start gap-2 border border-border bg-card/80 p-2">
              <MapPin className="w-3.5 h-3.5 text-[var(--primary)] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{atm.name}</span>
                  <a
                    href={mapsLink(atm.mapsQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] text-[10px] font-mono flex items-center gap-0.5 hover:underline"
                  >
                    Map <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">{atm.note}</p>
              </div>
            </div>
          ))}
          {/* Avoid ATM */}
          <div className="flex items-start gap-2 border border-red-500/30 bg-red-500/5 p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-red-400">{AVOID_ATM.name}</span>
              <p className="text-[10px] text-red-400/80">{AVOID_ATM.reason}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash-Only Refuges */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Cash-Only Refuges</div>
        <div className="flex flex-wrap gap-1">
          {CASH_ONLY_REFUGES.map((r, i) => {
            const flagColors: Record<string, string> = {
              France: "bg-blue-500/10 text-blue-400 border-blue-500/20",
              Italy: "bg-green-500/10 text-green-400 border-green-500/20",
              Switzerland: "bg-red-500/10 text-red-400 border-red-500/20",
            };
            return (
              <span key={i} className={`text-[10px] px-2 py-0.5 border ${flagColors[r.country] || "border-border text-foreground/60"}`}>
                {r.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── eSIM Section ────────────────────────────────────────────

function ESIMSection() {
  return (
    <div className="space-y-3">
      <div className="border border-border bg-[var(--primary)]/5 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-xs font-semibold">Your Meta Phone Has eSIM</span>
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)]">
          No need to buy a physical SIM card. Set up an eSIM <strong>before leaving the US</strong> — download the profile on WiFi at home. It'll work across France, Italy, and Switzerland (EU roaming). Keep your US number active for texts/calls via WiFi calling.
        </p>
      </div>

      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Top eSIM Options</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ESIM_OPTIONS.map((opt, i) => (
          <div key={i} className="border border-border bg-card/80 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">{opt.name}</span>
              <a
                href={opt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] text-[10px] font-mono flex items-center gap-0.5 hover:underline"
              >
                Visit <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--muted-foreground)] mb-1">
              <span>{opt.price}</span>
              <span>·</span>
              <span>{opt.data}</span>
            </div>
            <p className="text-[10px] text-foreground/70">{opt.note}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[var(--muted-foreground)] border-t border-border pt-2">
        <Wifi className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span><strong>Pro tip:</strong> Orange has the best mountain coverage in the French Alps. If you'll be relying on your phone for navigation on the trail, Orange Travel eSIM is the safest bet.</span>
      </div>
    </div>
  );
}

// ── Chamonix Essentials Map ─────────────────────────────────

function ChamonixEssentials() {
  const catIcons: Record<string, React.ReactNode> = {
    supermarket: <ShoppingBag className="w-3.5 h-3.5 text-green-500" />,
    gear: <span className="text-sm">🎒</span>,
    atm: <CreditCard className="w-3.5 h-3.5 text-amber-500" />,
    pharmacy: <span className="text-sm">💊</span>,
    "tourist-office": <Landmark className="w-3.5 h-3.5 text-blue-500" />,
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--muted-foreground)] mb-2">
        Key locations in Chamonix. Tap "Map" to open in Google Maps for directions.
      </p>
      {CHAMONIX_ESSENTIALS.map((loc, i) => (
        <div key={i} className="border border-border bg-card/80 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">{catIcons[loc.category]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold">{loc.name}</span>
                <a
                  href={mapsLink(loc.mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] text-[10px] font-mono flex items-center gap-0.5 hover:underline"
                >
                  <MapPin className="w-2.5 h-2.5" /> Map <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              {loc.address && <p className="text-[10px] text-[var(--muted-foreground)] font-mono mt-0.5">{loc.address}</p>}
              {loc.hours && (
                <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  <Clock className="w-2.5 h-2.5" /> {loc.hours}
                </div>
              )}
              {loc.note && <p className="text-[10px] text-foreground/70 mt-1">{loc.note}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pre-Hike Checklist ──────────────────────────────────────

function PreHikeChecklist() {
  const STORAGE_KEY = "tmb-prehike-checklist";
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggle = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories: { key: ChecklistItem["category"]; label: string; icon: React.ReactNode }[] = [
    { key: "before-flight", label: "Before Your Flight", icon: <PlaneTakeoff className="w-3.5 h-3.5" /> },
    { key: "at-airport", label: "At the Airport", icon: <Luggage className="w-3.5 h-3.5" /> },
    { key: "chamonix-arrival", label: "Arriving in Chamonix", icon: <MapPin className="w-3.5 h-3.5" /> },
    { key: "pre-hike", label: "Day Before the Hike", icon: <Mountain className="w-3.5 h-3.5" /> },
  ];

  const total = PRE_TRIP_CHECKLIST.length;
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{done}/{total}</span>
      </div>

      {categories.map(cat => {
        const items = PRE_TRIP_CHECKLIST.filter(item => item.category === cat.key);
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--primary)]">{cat.icon}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">{cat.label}</span>
            </div>
            <div className="space-y-1">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-start gap-2 text-left px-2 py-1.5 hover:bg-accent/30 transition-colors rounded-sm"
                >
                  {checked[item.id] ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 shrink-0" />
                  )}
                  <span className={`text-xs ${checked[item.id] ? "line-through text-[var(--muted-foreground)]" : "text-foreground"}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Things to Do ────────────────────────────────────────────

function ThingsToDo() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted-foreground)] mb-2">
        Arrive a day early to acclimate and shake off jet lag. Here are the best ways to spend your pre-hike day in Chamonix.
      </p>
      {CHAMONIX_ACTIVITIES.map((act, i) => (
        <div key={i} className="border border-border bg-card/80 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">{act.name}</span>
            {act.mapsQuery && (
              <a
                href={mapsLink(act.mapsQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] text-[10px] font-mono flex items-center gap-0.5 hover:underline"
              >
                <MapPin className="w-2.5 h-2.5" /> Map <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed mb-2">{act.description}</p>
          <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--muted-foreground)]">
            <span><Clock className="w-2.5 h-2.5 inline mr-0.5" />{act.duration}</span>
            {act.cost && <span><Banknote className="w-2.5 h-2.5 inline mr-0.5" />{act.cost}</span>}
          </div>
          {act.tip && (
            <div className="flex items-start gap-1.5 mt-2 text-[10px] text-[var(--primary)]">
              <Star className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{act.tip}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Annecy Side Trip ────────────────────────────────────────

function AnneySideTrip() {
  return (
    <div className="space-y-3">
      <div className="border border-border bg-card/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-semibold">{ANNECY_SIDE_TRIP.name}</span>
            <span className="text-[10px] font-mono text-[var(--primary)] ml-2">"{ANNECY_SIDE_TRIP.tagline}"</span>
          </div>
          <a
            href={mapsLink(ANNECY_SIDE_TRIP.mapsQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] text-[10px] font-mono flex items-center gap-0.5 hover:underline"
          >
            <MapPin className="w-2.5 h-2.5" /> Map <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <p className="text-[11px] text-foreground/80 leading-relaxed mb-3">{ANNECY_SIDE_TRIP.description}</p>
        <div className="space-y-1">
          {ANNECY_SIDE_TRIP.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
              <Palmtree className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
              <span>{h}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] font-mono text-[var(--muted-foreground)] flex items-center gap-1">
          <Bus className="w-3 h-3" /> {ANNECY_SIDE_TRIP.transport}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function ArrivalDeparture({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? "" : "container py-6"}>
      <div className="space-y-1">
        {/* ─── ARRIVAL ─── */}
        <div className="mb-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-[var(--primary)] mb-2 px-1">
            ✈ Arrival — Getting There
          </div>

          <Section
            icon={<Plane className="w-4 h-4" />}
            title="International Travel Guide"
            subtitle="First time flying internationally? Start here"
            accent="border-l-blue-500"
            defaultOpen={false}
          >
            <InternationalTravelGuide />
          </Section>

          <Section
            icon={<PlaneTakeoff className="w-4 h-4" />}
            title="Your Flight"
            subtitle="Flight details & booking info"
            accent="border-l-sky-500"
            defaultOpen={false}
          >
            <FlightCard />
          </Section>

          <Section
            icon={<Building2 className="w-4 h-4" />}
            title="Your Hotels"
            subtitle="RockyPop (pre-hike) + Les Aiglons (post-hike)"
            accent="border-l-emerald-500"
            defaultOpen={false}
          >
            <HotelCard />
          </Section>

          <Section
            icon={<Bus className="w-4 h-4" />}
            title="Your Bus Tickets"
            subtitle="Outbound Jul 25 + Return Aug 5 · Book now"
            accent="border-l-cyan-500"
            defaultOpen={false}
          >
            <BusTransferCard />
          </Section>

          <Section
            icon={<Bus className="w-4 h-4" />}
            title="All Transport Options"
            subtitle="FlixBus, AlpyBus, shuttles · €19–100"
            accent="border-l-green-500"
            defaultOpen={false}
          >
            <TransportSection direction="to" />
          </Section>

          <Section
            icon={<CreditCard className="w-4 h-4" />}
            title="Money & Currency Guide"
            subtitle="ATMs, cash tips, scam avoidance"
            accent="border-l-amber-500"
            defaultOpen={false}
          >
            <MoneySection />
          </Section>

          <Section
            icon={<Smartphone className="w-4 h-4" />}
            title="eSIM & Connectivity"
            subtitle="Your phone has eSIM — set up before you leave"
            accent="border-l-violet-500"
            defaultOpen={false}
          >
            <ESIMSection />
          </Section>

          <Section
            icon={<MapPin className="w-4 h-4" />}
            title="Chamonix Essentials"
            subtitle="Supermarket, gear shop, ATMs, pharmacy"
            accent="border-l-rose-500"
            defaultOpen={false}
          >
            <ChamonixEssentials />
          </Section>

          <Section
            icon={<ClipboardCheck className="w-4 h-4" />}
            title="Pre-Trip Checklist"
            subtitle="Interactive — tap to check off items"
            accent="border-l-teal-500"
            defaultOpen={false}
          >
            <PreHikeChecklist />
          </Section>

          <Section
            icon={<Star className="w-4 h-4" />}
            title="Things to Do (Day Before)"
            subtitle="Aiguille du Midi, Lac Blanc, spa & more"
            accent="border-l-orange-500"
            defaultOpen={false}
          >
            <ThingsToDo />
          </Section>
        </div>

        {/* ─── DEPARTURE ─── */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-[var(--primary)] mb-2 px-1">
            ✈ Departure — Getting Home
          </div>

          <Section
            icon={<Bus className="w-4 h-4" />}
            title="Return Transport"
            subtitle="Chamonix → Geneva Airport · Book in advance"
            accent="border-l-indigo-500"
            defaultOpen={false}
          >
            <TransportSection direction="from" />
          </Section>

          <Section
            icon={<Palmtree className="w-4 h-4" />}
            title="Side Trip: Annecy"
            subtitle="The Venice of the Alps · 1 hour from Chamonix"
            accent="border-l-cyan-500"
            defaultOpen={false}
          >
            <AnneySideTrip />
          </Section>
        </div>
      </div>
    </div>
  );
}
