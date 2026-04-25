import { useState, useRef, useCallback, type ReactNode } from "react";
import { Check } from "lucide-react";
import { haptic } from "@/lib/haptics";

interface SwipeToCompleteProps {
  children: ReactNode;
  onSwipeComplete: () => void;
  /** Threshold in px to trigger complete (default: 80) */
  threshold?: number;
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean;
  /** Whether the item is already completed */
  completed?: boolean;
  /** Additional className for the outer wrapper */
  className?: string;
}

export default function SwipeToComplete({
  children,
  onSwipeComplete,
  threshold = 80,
  enabled = true,
  completed = false,
  className = "",
}: SwipeToCompleteProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      isHorizontalRef.current = null;
      setSwiping(true);
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !swiping) return;
      const dx = e.touches[0].clientX - startXRef.current;
      const dy = e.touches[0].clientY - startYRef.current;

      // Determine direction on first significant move
      if (isHorizontalRef.current === null) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }

      if (!isHorizontalRef.current) return; // vertical scroll, ignore

      setSwipeX(Math.max(0, Math.min(dx, threshold * 1.5))); // only right swipe, capped
    },
    [enabled, swiping, threshold]
  );

  // Haptic when crossing threshold during swipe
  const crossedRef = useRef(false);
  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (swipeX > threshold) {
      haptic("medium");
      onSwipeComplete();
    }
    setSwipeX(0);
    isHorizontalRef.current = null;
    crossedRef.current = false;
  }, [swipeX, threshold, onSwipeComplete]);

  const completeRevealed = swipeX > threshold / 2;
  const bgColor = completed
    ? (completeRevealed ? "bg-[var(--muted)]/30" : "bg-[var(--muted)]/15")
    : (completeRevealed ? "bg-[var(--primary)]/25" : "bg-[var(--primary)]/10");
  const iconColor = completed ? "text-[var(--muted-foreground)]" : "text-[var(--primary)]";
  const label = completed ? "UNDO" : "DONE";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Complete background revealed on swipe */}
      <div
        className={`absolute inset-0 flex items-center justify-start pl-5 transition-colors ${bgColor}`}
      >
        <div className={`flex flex-col items-center gap-1 transition-opacity ${completeRevealed ? "opacity-100" : "opacity-50"}`}>
          <Check className={`w-5 h-5 ${iconColor}`} />
          <span className={`text-[8px] font-mono uppercase tracking-wider ${iconColor}`}>{label}</span>
        </div>
      </div>
      {/* Swipeable content */}
      <div
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-background"
      >
        {children}
      </div>
    </div>
  );
}
