// Milestone Celebration — confetti burst + mountain ascent message for 5 lb weight thresholds
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mountain, Trophy } from "lucide-react";
import { haptic } from "@/lib/haptics";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  spin: number;
  delay: number;
}

const COLORS = [
  "#f97316", // orange (primary)
  "#fbbf24", // amber
  "#34d399", // emerald
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#f472b6", // pink
  "#ffffff", // white
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 50,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
    angle: Math.random() * 360,
    velocity: 2 + Math.random() * 4,
    spin: (Math.random() - 0.5) * 720,
    delay: Math.random() * 0.3,
  }));
}

// Altitude camp names keyed by weight thresholds
const CAMP_NAMES: Record<number, string> = {
  230: "Base Camp",
  225: "Camp I",
  220: "Camp II",
  215: "Camp III",
  210: "High Camp",
  205: "Summit Ridge",
  200: "The Summit",
};

function getCampName(weight: number): string | null {
  // Find the nearest 5 lb threshold at or below current weight
  const thresholds = Object.keys(CAMP_NAMES).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (weight <= t) return CAMP_NAMES[t];
  }
  return null;
}

interface MilestoneCelebrationProps {
  /** Current weight after logging */
  currentWeight: number;
  /** Previous weight before this entry */
  previousWeight: number;
  /** Whether to show the celebration */
  show: boolean;
  /** Callback when celebration finishes */
  onComplete: () => void;
}

export default function MilestoneCelebration({ currentWeight, previousWeight, show, onComplete }: MilestoneCelebrationProps) {
  const [particles] = useState(() => generateParticles(40));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine which 5 lb threshold was crossed
  const crossedThreshold = (() => {
    const prev5 = Math.ceil(previousWeight / 5) * 5;
    const curr5 = Math.ceil(currentWeight / 5) * 5;
    if (curr5 < prev5) return curr5;
    // Also check if we went below a round number
    for (let t = Math.floor(previousWeight); t >= Math.ceil(currentWeight); t--) {
      if (t % 5 === 0 && currentWeight <= t && previousWeight > t) return t;
    }
    return null;
  })();

  const campName = crossedThreshold ? getCampName(crossedThreshold) : null;
  const lbsLost = Math.round(previousWeight - currentWeight);

  useEffect(() => {
    if (show) {
      haptic("success");
      timerRef.current = setTimeout(onComplete, 4000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 pointer-events-auto"
            onClick={onComplete}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size * 0.6,
                  backgroundColor: p.color,
                  borderRadius: Math.random() > 0.5 ? "50%" : "1px",
                }}
                initial={{ opacity: 1, scale: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5],
                  x: Math.cos((p.angle * Math.PI) / 180) * p.velocity * 80,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.velocity * 80 + 200,
                  rotate: p.spin,
                }}
                transition={{
                  duration: 2.5,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Message card */}
          <motion.div
            className="relative z-10 bg-card border border-[var(--primary)]/40 rounded-lg p-6 max-w-xs text-center shadow-2xl shadow-[var(--primary)]/20"
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.4 }}
            >
              <Mountain className="w-10 h-10 text-[var(--primary)] mx-auto mb-3" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--primary)] font-mono mb-1">Milestone Reached</div>
              <div className="text-2xl font-bold text-foreground font-mono">
                {crossedThreshold ? `Under ${crossedThreshold} lb` : `${lbsLost} lb down!`}
              </div>
              {campName && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-amber-400">
                  <Trophy className="w-4 h-4" />
                  <span className="font-mono">{campName}</span>
                </div>
              )}
              <div className="mt-3 text-xs text-[var(--muted-foreground)] font-mono">
                Keep climbing. The summit is waiting.
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to detect when a 5 lb milestone is crossed
 */
export function useMilestoneDetector() {
  const [celebration, setCelebration] = useState<{ current: number; previous: number } | null>(null);
  const prevWeightRef = useRef<number | null>(null);

  const checkMilestone = useCallback((newWeight: number, previousWeight?: number) => {
    const prev = previousWeight ?? prevWeightRef.current;
    if (prev === null) {
      prevWeightRef.current = newWeight;
      return;
    }

    // Check if we crossed a 5 lb threshold going down
    const prevFloor5 = Math.floor(prev / 5) * 5;
    const newFloor5 = Math.floor(newWeight / 5) * 5;

    if (newWeight < prev && newFloor5 < prevFloor5) {
      setCelebration({ current: newWeight, previous: prev });
    }

    prevWeightRef.current = newWeight;
  }, []);

  const dismiss = useCallback(() => setCelebration(null), []);

  return { celebration, checkMilestone, dismiss };
}
