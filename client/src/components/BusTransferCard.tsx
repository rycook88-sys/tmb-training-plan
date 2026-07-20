import React, { useState } from "react";
import { Bus, ChevronDown, ChevronUp, Clock, MapPin, CheckCircle, Copy, Check } from "lucide-react";
import { BUS_BOOKINGS } from "@/lib/travel-data";
import type { BusBooking } from "@/lib/travel-data";

function BookingCard({ booking }: { booking: BusBooking }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyBookingNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(booking.bookingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--accent)]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            booking.direction === "outbound" ? "bg-emerald-500/15" : "bg-blue-500/15"
          }`}>
            <Bus size={18} className={booking.direction === "outbound" ? "text-emerald-400" : "text-blue-400"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{booking.label}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{booking.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted-foreground)]">
                {booking.departTime} → {booking.arriveTime}
              </span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
          )}
          {expanded ? <ChevronUp size={16} className="text-[var(--muted-foreground)]" /> : <ChevronDown size={16} className="text-[var(--muted-foreground)]" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Confirmed badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              ✓ CONFIRMED
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">{booking.carrier}</span>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-3 py-2">
            <div className="text-center">
              <p className="text-xl font-mono font-bold text-[var(--foreground)]">{booking.departTime}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 max-w-[100px] leading-tight">{booking.from}</p>
            </div>
            <div className="flex-1 flex items-center gap-1 text-[var(--muted-foreground)]">
              <div className="flex-1 h-px bg-[var(--muted-foreground)]/30" />
              <div className="flex items-center gap-1 px-2">
                <Clock size={12} />
                <span className="text-xs font-mono">{booking.duration}</span>
              </div>
              <div className="flex-1 h-px bg-[var(--muted-foreground)]/30" />
            </div>
            <div className="text-center">
              <p className="text-xl font-mono font-bold text-[var(--foreground)]">{booking.arriveTime}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 max-w-[100px] leading-tight">{booking.to}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[var(--accent)]/20 p-2 rounded-lg">
              <p className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wider mb-0.5">Bus</p>
              <p className="font-mono font-semibold text-[var(--foreground)]">{booking.busNumber}</p>
            </div>
            <div className="bg-[var(--accent)]/20 p-2 rounded-lg">
              <p className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wider mb-0.5">Seat</p>
              <p className="font-mono font-semibold text-[var(--foreground)]">{booking.seat}</p>
            </div>
            <div className="bg-[var(--accent)]/20 p-2 rounded-lg">
              <p className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wider mb-0.5">Passenger</p>
              <p className="font-semibold text-[var(--foreground)]">{booking.passenger}</p>
            </div>
            <div className="bg-[var(--accent)]/20 p-2 rounded-lg">
              <p className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wider mb-0.5">Booking #</p>
              <button
                onClick={copyBookingNumber}
                className="flex items-center gap-1 font-mono font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              >
                <span className="text-xs">{booking.bookingNumber}</span>
                {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              </button>
            </div>
          </div>

          {/* Context note */}
          <p className="text-xs text-[var(--muted-foreground)] bg-[var(--accent)]/20 p-2 rounded-lg">
            {booking.context}
          </p>
        </div>
      )}
    </div>
  );
}

export default function BusTransferCard() {
  return (
    <div className="space-y-3">
      {BUS_BOOKINGS.map((booking) => (
        <BookingCard key={booking.direction} booking={booking} />
      ))}
    </div>
  );
}
