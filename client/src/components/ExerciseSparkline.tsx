// Tiny inline sparkline showing weight trend for an exercise across recent sessions
import type { WorkoutSession } from "@/lib/hooks";

interface ExerciseSparklineProps {
  exerciseName: string;
  sessions: WorkoutSession[];
  /** Max number of recent data points to show */
  maxPoints?: number;
  /** Whether lower is better (e.g. assist exercises) */
  lowerIsBetter?: boolean;
}

export default function ExerciseSparkline({
  exerciseName,
  sessions,
  maxPoints = 8,
  lowerIsBetter = false,
}: ExerciseSparklineProps) {
  // Extract weight values for this exercise from recent sessions (oldest → newest)
  const dataPoints: number[] = [];
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const session of sorted) {
    for (const ex of session.exercises) {
      if (ex.name === exerciseName && ex.done && ex.weight) {
        const w = parseFloat(ex.weight);
        if (!isNaN(w) && w > 0) {
          dataPoints.push(w);
        }
      }
    }
  }

  // Need at least 2 points for a line
  const points = dataPoints.slice(-maxPoints);
  if (points.length < 2) return null;

  const w = 64;
  const h = 20;
  const pad = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  // Build SVG polyline
  const coords = points.map((val, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (val - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  // Determine trend color
  const first = points[0];
  const last = points[points.length - 1];
  const improving = lowerIsBetter ? last < first : last > first;
  const flat = Math.abs(last - first) < 0.5;
  const color = flat
    ? "var(--muted-foreground)"
    : improving
      ? "#34d399" // green
      : "#f87171"; // red

  return (
    <div className="inline-flex items-center gap-1" title={`Last ${points.length} sessions: ${points.map(p => p.toString()).join(" → ")}`}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dot on latest point */}
        <circle
          cx={pad + ((points.length - 1) / (points.length - 1)) * (w - pad * 2)}
          cy={pad + (1 - (last - min) / range) * (h - pad * 2)}
          r="2"
          fill={color}
        />
      </svg>
    </div>
  );
}
