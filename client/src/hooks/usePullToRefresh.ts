import { useState, useRef, useCallback, useEffect } from "react";
import { haptic } from "@/lib/haptics";

interface UsePullToRefreshOptions {
  /** Callback to run on refresh */
  onRefresh: () => Promise<void> | void;
  /** Minimum pull distance in pixels to trigger refresh (default: 80) */
  threshold?: number;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
}

interface UsePullToRefreshReturn {
  /** Current pull distance (0 when not pulling) */
  pullDistance: number;
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
  /** Attach these to the scrollable container */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing) return;
      // Only start pull if at the top of the page
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [enabled, isRefreshing]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || !enabled || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0) {
        // Apply resistance — pull distance is sqrt-dampened
        const dampened = Math.min(diff * 0.4, 150);
        setPullDistance(dampened);
      }
    },
    [enabled, isRefreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= threshold) {
      haptic("medium");
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold during refresh
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
