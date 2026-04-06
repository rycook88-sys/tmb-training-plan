import { useState, useRef, useCallback, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface SwipeToDeleteProps {
  children: ReactNode;
  onSwipeDelete: () => void;
  /** Threshold in px to trigger delete (default: -80) */
  threshold?: number;
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean;
  /** Additional className for the outer wrapper */
  className?: string;
}

export default function SwipeToDelete({
  children,
  onSwipeDelete,
  threshold = -80,
  enabled = true,
  className = "",
}: SwipeToDeleteProps) {
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

      setSwipeX(Math.min(0, dx)); // only left swipe
    },
    [enabled, swiping]
  );

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (swipeX < threshold) {
      onSwipeDelete();
    }
    setSwipeX(0);
    isHorizontalRef.current = null;
  }, [swipeX, threshold, onSwipeDelete]);

  // Mouse drag support for desktop
  const [mouseDown, setMouseDown] = useState(false);
  const mouseStartXRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      mouseStartXRef.current = e.clientX;
      setMouseDown(true);
    },
    [enabled]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !mouseDown) return;
      const dx = e.clientX - mouseStartXRef.current;
      setSwipeX(Math.min(0, dx));
    },
    [enabled, mouseDown]
  );

  const handleMouseUp = useCallback(() => {
    if (!mouseDown) return;
    setMouseDown(false);
    if (swipeX < threshold) {
      onSwipeDelete();
    }
    setSwipeX(0);
  }, [mouseDown, swipeX, threshold, onSwipeDelete]);

  const handleMouseLeave = useCallback(() => {
    if (mouseDown) {
      setMouseDown(false);
      setSwipeX(0);
    }
  }, [mouseDown]);

  const deleteRevealed = swipeX < threshold / 2;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Delete background revealed on swipe */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-5 transition-colors ${
          deleteRevealed ? "bg-red-500/25" : "bg-red-500/10"
        }`}
      >
        <div className={`flex flex-col items-center gap-1 transition-opacity ${deleteRevealed ? "opacity-100" : "opacity-50"}`}>
          <Trash2 className="w-4 h-4 text-red-400" />
          <span className="text-[8px] font-mono uppercase tracking-wider text-red-400">Delete</span>
        </div>
      </div>
      {/* Swipeable content */}
      <div
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping || mouseDown ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  );
}
