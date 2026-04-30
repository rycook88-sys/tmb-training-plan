import React, { useState } from "react";
import { Bus, ChevronDown, ChevronUp, ExternalLink, Clock, MapPin, Star, AlertTriangle } from "lucide-react";
import { BUS_TRANSFERS } from "@/lib/travel-data";
import type { BusTransferRoute, BusOption } from "@/lib/travel-data";

function TagBadge({ tag }: { tag?: string }) {
  if (!tag) return null;
  const styles: Record<string, string> = {
    recommended: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    cheapest: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    budget: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const labels: Record<string, string> = {
    recommended: "★ RECOMMENDED",
    cheapest: "CHEAPEST",
    budget: "BUDGET PICK",
  };
  return (
    <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${styles[tag] || ""}`}>
      {labels[tag] || tag.toUpperCase()}
    </span>
  );
}

function BusOptionRow({ option }: { option: BusOption }) {
  const isRisky = option.note?.includes("⚠️") || option.note?.includes("Risky");
  return (
    <div className={`p-3 rounded-lg border ${
      option.tag === "recommended" 
        ? "border-emerald-500/30 bg-emerald-500/5" 
        : isRisky 
          ? "border-red-500/20 bg-red-500/5"
          : "border-[var(--border)] bg-[var(--card)]/50"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            {option.carrier}
          </span>
          <TagBadge tag={option.tag} />
        </div>
        <span className="text-base font-bold text-[var(--primary)]">{option.price}</span>
      </div>
      
      <div className="flex items-center gap-3 mb-1">
        <span className="text-lg font-mono font-semibold text-[var(--foreground)]">{option.departTime}</span>
        <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
          <div className="w-8 h-px bg-[var(--muted-foreground)]/40" />
          <Clock size={12} />
          <span className="text-xs">{option.duration}</span>
          <div className="w-8 h-px bg-[var(--muted-foreground)]/40" />
        </div>
        <span className="text-lg font-mono font-semibold text-[var(--foreground)]">{option.arriveTime}</span>
      </div>

      <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] mb-1">
        <MapPin size={10} />
        <span>{option.stop}</span>
      </div>

      {option.note && (
        <p className={`text-xs mt-1.5 ${isRisky ? "text-red-400" : "text-[var(--muted-foreground)]"}`}>
          {isRisky && <AlertTriangle size={10} className="inline mr-1" />}
          {option.note}
        </p>
      )}
    </div>
  );
}

function RouteCard({ route }: { route: BusTransferRoute }) {
  const [expanded, setExpanded] = useState(false);
  const recommended = route.options.find(o => o.tag === "recommended");

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--accent)]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            route.direction === "outbound" ? "bg-emerald-500/15" : "bg-blue-500/15"
          }`}>
            <Bus size={18} className={route.direction === "outbound" ? "text-emerald-400" : "text-blue-400"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{route.label}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{route.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {recommended && !expanded && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {recommended.departTime} · {recommended.price}
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-[var(--muted-foreground)]" /> : <ChevronDown size={16} className="text-[var(--muted-foreground)]" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Context note */}
          <p className="text-xs text-[var(--muted-foreground)] bg-[var(--accent)]/20 p-2 rounded-lg">
            {route.context}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {route.options.map((opt, i) => (
              <BusOptionRow key={i} option={opt} />
            ))}
          </div>

          {/* Booking link */}
          <a
            href={route.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={14} />
            Book on FlixBus / Alpine Fleet
          </a>
        </div>
      )}
    </div>
  );
}

export default function BusTransferCard() {
  return (
    <div className="space-y-3">
      {BUS_TRANSFERS.map((route) => (
        <RouteCard key={route.direction} route={route} />
      ))}
    </div>
  );
}
