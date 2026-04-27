// FlightCard — Full Delta reservation display with leg-by-leg breakdown
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, PlaneTakeoff, PlaneLanding, Clock, MapPin,
  ChevronDown, ChevronUp, Copy, Check, Coffee,
} from "lucide-react";
import { FLIGHT_BOOKING } from "@/lib/travel-data";
import type { FlightLeg, FlightItinerary } from "@/lib/travel-data";

// ── Helpers ─────────────────────────────────────────────────

function airlineLogo(airline: string): string {
  // Simple color-coded airline badges
  const map: Record<string, string> = {
    Delta: "bg-blue-600",
    "Air France": "bg-blue-800",
    KLM: "bg-sky-600",
  };
  return map[airline] || "bg-slate-600";
}

function airlineColor(airline: string): string {
  const map: Record<string, string> = {
    Delta: "text-blue-400",
    "Air France": "text-blue-300",
    KLM: "text-sky-400",
  };
  return map[airline] || "text-slate-400";
}

// ── Confirmation Header ─────────────────────────────────────

function ConfirmationHeader() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(FLIGHT_BOOKING.confirmationCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
            DL
          </div>
          <span className="text-sm font-semibold text-foreground">Delta Air Lines</span>
        </div>
        <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
          {FLIGHT_BOOKING.passenger} · {FLIGHT_BOOKING.tripDates}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Confirmation</div>
          <div className="text-lg font-mono font-bold text-[var(--primary)] tracking-wider">
            {FLIGHT_BOOKING.confirmationCode}
          </div>
        </div>
        <button
          onClick={copyCode}
          className="p-1.5 hover:bg-accent/50 rounded transition-colors"
          title="Copy confirmation code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Flight Leg Row ──────────────────────────────────────────

function LegRow({ leg, index, total }: { leg: FlightLeg; index: number; total: number }) {
  return (
    <div className="relative">
      {/* Leg card */}
      <div className="border border-border bg-card/80 p-3">
        {/* Flight number + aircraft header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`px-1.5 py-0.5 text-[9px] font-mono font-bold text-white ${airlineLogo(leg.operatedBy.split(" ")[0] === "Air" ? "Air France" : leg.operatedBy.includes("KLM") ? "KLM" : "Delta")}`}>
              {leg.flightNumber}
            </div>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
              {leg.aircraft}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{leg.duration}</span>
          </div>
        </div>

        {/* Route visualization */}
        <div className="flex items-center gap-3">
          {/* Departure */}
          <div className="flex-1 min-w-0">
            <div className="text-lg font-mono font-bold text-foreground leading-none">{leg.depart.time}</div>
            <div className="text-sm font-mono font-bold text-foreground mt-0.5">{leg.from.code}</div>
            <div className="text-[9px] text-[var(--muted-foreground)] truncate">{leg.from.city}</div>
            {leg.from.terminal && (
              <div className="text-[9px] text-[var(--muted-foreground)]">{leg.from.terminal}</div>
            )}
          </div>

          {/* Flight line */}
          <div className="flex-shrink-0 flex flex-col items-center gap-0.5 w-16">
            <Plane className="w-3.5 h-3.5 text-[var(--primary)] rotate-0" />
            <div className="w-full h-px bg-gradient-to-r from-[var(--primary)]/50 via-[var(--primary)] to-[var(--primary)]/50" />
          </div>

          {/* Arrival */}
          <div className="flex-1 min-w-0 text-right">
            <div className="text-lg font-mono font-bold text-foreground leading-none">{leg.arrive.time}</div>
            <div className="text-sm font-mono font-bold text-foreground mt-0.5">{leg.to.code}</div>
            <div className="text-[9px] text-[var(--muted-foreground)] truncate">{leg.to.city}</div>
            {leg.to.terminal && (
              <div className="text-[9px] text-[var(--muted-foreground)]">{leg.to.terminal}</div>
            )}
          </div>
        </div>

        {/* Seat + fare info */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-[10px] font-mono text-foreground font-semibold">
                Seat {leg.seat}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
              {leg.fareClass}
            </span>
          </div>
          {leg.operatedBy !== "Delta Air Lines" && (
            <span className={`text-[9px] font-mono ${airlineColor(leg.operatedBy.includes("KLM") ? "KLM" : leg.operatedBy.includes("Air France") ? "Air France" : "Delta")}`}>
              Op. by {leg.operatedBy}
            </span>
          )}
        </div>
      </div>

      {/* Layover connector */}
      {leg.layoverAfter && index < total - 1 && (
        <div className="flex items-center gap-2 py-2 px-4">
          <div className="w-px h-4 bg-border ml-2" />
          <Coffee className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-mono text-amber-500 font-semibold">
            {leg.layoverAfter} layover
          </span>
          <span className="text-[9px] font-mono text-[var(--muted-foreground)]">
            · Change planes at {leg.to.code}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Itinerary Section ───────────────────────────────────────

function ItinerarySection({ itinerary }: { itinerary: FlightItinerary }) {
  const [expanded, setExpanded] = useState(false);
  const isOutbound = itinerary.direction === "outbound";

  return (
    <div className={`border ${isOutbound ? "border-blue-500/30" : "border-indigo-500/30"} bg-card/50`}>
      {/* Summary header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        <div className={`w-8 h-8 flex items-center justify-center ${isOutbound ? "bg-blue-500/10 text-blue-400" : "bg-indigo-500/10 text-indigo-400"}`}>
          {isOutbound ? <PlaneTakeoff className="w-4 h-4" /> : <PlaneLanding className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{itinerary.label}</span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{itinerary.departDate}</span>
          </div>
          <div className="text-xs font-mono text-[var(--muted-foreground)] mt-0.5">
            {itinerary.route} · {itinerary.totalDuration} · {itinerary.legs.length} flights
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
        )}
      </button>

      {/* Expanded leg details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-0">
              {itinerary.legs.map((leg, i) => (
                <LegRow key={leg.flightNumber} leg={leg} index={i} total={itinerary.legs.length} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────

export default function FlightCard() {
  return (
    <div className="space-y-3">
      <ConfirmationHeader />

      {/* Quick summary bar */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-card/80 border border-border p-2 text-center">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Depart</div>
          <div className="text-xs font-mono font-bold text-foreground">Jul 24</div>
          <div className="text-[9px] font-mono text-[var(--muted-foreground)]">1:40 PM</div>
        </div>
        <div className="bg-card/80 border border-border p-2 text-center">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Return</div>
          <div className="text-xs font-mono font-bold text-foreground">Aug 5</div>
          <div className="text-[9px] font-mono text-[var(--muted-foreground)]">11:49 PM</div>
        </div>
        <div className="bg-card/80 border border-border p-2 text-center">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Trip</div>
          <div className="text-xs font-mono font-bold text-foreground">12 days</div>
          <div className="text-[9px] font-mono text-[var(--muted-foreground)]">6 flights</div>
        </div>
      </div>

      {/* Itineraries */}
      {FLIGHT_BOOKING.itineraries.map((itin) => (
        <ItinerarySection key={itin.direction} itinerary={itin} />
      ))}

      {/* eTicket footer */}
      <div className="flex items-center justify-between text-[9px] font-mono text-[var(--muted-foreground)] pt-1">
        <span>eTicket: {FLIGHT_BOOKING.eTicket}</span>
        <span>Expires: {FLIGHT_BOOKING.ticketExpiration}</span>
      </div>
    </div>
  );
}
