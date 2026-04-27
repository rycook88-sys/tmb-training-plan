// HotelCard — Displays hotel bookings with check-in/out, address, confirmation, luggage storage tip
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Phone, Copy, Check, Clock,
  ChevronDown, ChevronUp, ExternalLink, Luggage, Info, Star,
} from "lucide-react";
import { HOTEL_BOOKINGS } from "@/lib/travel-data";
import type { HotelBooking } from "@/lib/travel-data";

// ── Helpers ─────────────────────────────────────────────────

function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.replace(/\+/g, " "))}`;
}

function phoneLink(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

// ── Single Hotel Card ───────────────────────────────────────

function HotelEntry({ hotel, defaultOpen = false }: { hotel: HotelBooking; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const copyConfirmation = () => {
    navigator.clipboard.writeText(hotel.confirmationNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isPreHike = hotel.checkIn.date === "Jul 25";

  return (
    <div className={`border ${isPreHike ? "border-emerald-500/30" : "border-amber-500/30"} bg-card/50`}>
      {/* Summary header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        <div className={`w-8 h-8 flex items-center justify-center ${isPreHike ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{hotel.name}</span>
            {hotel.stars && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            )}
          </div>
          <div className="text-xs font-mono text-[var(--muted-foreground)] mt-0.5">
            {hotel.checkIn.day}, {hotel.checkIn.date} – {hotel.checkOut.day}, {hotel.checkOut.date} · {hotel.location}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
        )}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Check-in / Check-out summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/80 border border-border p-2.5">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Check-in</div>
                  <div className="text-sm font-mono font-bold text-foreground mt-0.5">{hotel.checkIn.day}, {hotel.checkIn.date}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-mono text-emerald-500">After {hotel.checkIn.time}</span>
                  </div>
                </div>
                <div className="bg-card/80 border border-border p-2.5">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Check-out</div>
                  <div className="text-sm font-mono font-bold text-foreground mt-0.5">{hotel.checkOut.day}, {hotel.checkOut.date}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] font-mono text-red-400">Before {hotel.checkOut.time}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 border border-border bg-card/80 p-2.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--primary)] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground">{hotel.address}</div>
                  <a
                    href={mapsLink(hotel.mapsQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] text-[10px] font-mono flex items-center gap-0.5 hover:underline mt-0.5"
                  >
                    Open in Google Maps <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Confirmation + Phone row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card/80 border border-border p-2.5">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Confirmation</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] truncate">{hotel.confirmationNumber}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyConfirmation(); }}
                      className="p-0.5 hover:bg-accent/50 rounded transition-colors shrink-0"
                      title="Copy confirmation number"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-[var(--muted-foreground)]" />
                      )}
                    </button>
                  </div>
                  <div className="text-[9px] font-mono text-[var(--muted-foreground)] mt-0.5">
                    via {hotel.bookedVia}
                  </div>
                </div>
                <div className="bg-card/80 border border-border p-2.5">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Phone</div>
                  <a
                    href={phoneLink(hotel.phone)}
                    className="text-xs font-mono text-foreground hover:text-[var(--primary)] transition-colors mt-0.5 block"
                  >
                    {hotel.phone}
                  </a>
                  <a
                    href={phoneLink(hotel.phone)}
                    className="text-[var(--primary)] text-[10px] font-mono flex items-center gap-0.5 hover:underline mt-0.5"
                  >
                    <Phone className="w-2.5 h-2.5" /> Call hotel
                  </a>
                </div>
              </div>

              {/* Notes */}
              {hotel.notes && hotel.notes.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">Notes</div>
                  {hotel.notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
                      <Info className="w-3 h-3 text-[var(--muted-foreground)] mt-0.5 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Luggage Storage Pro-Tip */}
              {hotel.luggageStorage && hotel.luggageStorage.available && (
                <div className={`border ${isPreHike ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"} p-3`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Luggage className={`w-4 h-4 ${isPreHike ? "text-emerald-400" : "text-amber-400"}`} />
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isPreHike ? "text-emerald-400" : "text-amber-400"}`}>
                      🎒 Luggage Storage — Pro Tip
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed">
                    {hotel.luggageStorage.details}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────

export default function HotelCard() {
  return (
    <div className="space-y-3">
      {/* Trip overview */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
            {HOTEL_BOOKINGS.length} Hotels · {HOTEL_BOOKINGS[0].checkIn.date} – {HOTEL_BOOKINGS[HOTEL_BOOKINGS.length - 1].checkOut.date}
          </div>
        </div>
      </div>

      {/* Hotel entries */}
      {HOTEL_BOOKINGS.map((hotel, i) => (
        <HotelEntry key={hotel.confirmationNumber} hotel={hotel} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
