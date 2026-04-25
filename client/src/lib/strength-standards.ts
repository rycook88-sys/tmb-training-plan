// Strength Standards for ~220 lb male
// Based on aggregated data from Symmetric Strength, ExRx, and Strength Level
// Each entry maps exercise name → array of [weight_threshold, percentile]
// Percentile = "stronger than X% of male lifters at ~220 lb bodyweight"
// Thresholds are sorted ascending; interpolate between entries

export interface StrengthStandard {
  exercise: string;
  shortName: string; // abbreviated for display
  unit: "lb" | "sec" | "assist";
  invertBetter?: boolean; // true if lower is better (e.g., assisted pull-ups)
  // [threshold, percentile] pairs — sorted ascending by threshold
  levels: [number, number][];
}

export const STRENGTH_STANDARDS: StrengthStandard[] = [
  {
    exercise: "Lateral Step-Down",
    shortName: "Step-Down",
    unit: "lb",
    levels: [
      [0, 5], [15, 25], [25, 45], [35, 60], [50, 75], [65, 88], [80, 95],
    ],
  },
  {
    exercise: "Bulgarian Split Squat",
    shortName: "BSS",
    unit: "lb",
    levels: [
      [20, 10], [35, 25], [50, 45], [60, 58], [75, 72], [90, 85], [110, 95],
    ],
  },
  {
    exercise: "Single-Leg RDL",
    shortName: "SL-RDL",
    unit: "lb",
    levels: [
      [15, 10], [25, 25], [40, 45], [55, 60], [70, 75], [85, 88], [100, 95],
    ],
  },
  {
    exercise: "Trap Bar Deadlift",
    shortName: "Trap DL",
    unit: "lb",
    levels: [
      [135, 10], [185, 20], [245, 35], [315, 55], [365, 70], [405, 82], [455, 90], [500, 96],
    ],
  },
  {
    exercise: "Standing Calf Raise Machine",
    shortName: "Calf Raise",
    unit: "lb",
    levels: [
      [90, 8], [135, 18], [200, 32], [275, 50], [330, 65], [400, 80], [475, 92],
    ],
  },
  {
    exercise: "Hip Adduction Machine",
    shortName: "Adduction",
    unit: "lb",
    levels: [
      [70, 10], [110, 22], [150, 38], [200, 55], [250, 72], [300, 86], [350, 95],
    ],
  },
  {
    exercise: "Farmer Carry",
    shortName: "Farmer",
    unit: "lb",
    levels: [
      [40, 10], [60, 25], [80, 45], [100, 62], [120, 78], [140, 88], [160, 95],
    ],
  },
  {
    exercise: "Assisted Pull-Up",
    shortName: "Pull-Up",
    unit: "assist",
    invertBetter: true, // lower assist = stronger
    // thresholds are assist weight; lower = better
    levels: [
      [120, 10], [100, 22], [80, 38], [60, 55], [40, 72], [20, 85], [0, 95],
    ],
  },
  {
    exercise: "Dumbbell Row",
    shortName: "DB Row",
    unit: "lb",
    levels: [
      [25, 8], [40, 20], [55, 35], [70, 52], [85, 68], [100, 82], [120, 93],
    ],
  },
  {
    exercise: "Overhead Press",
    shortName: "OHP",
    unit: "lb",
    levels: [
      [20, 8], [30, 18], [40, 32], [50, 48], [60, 65], [70, 78], [85, 90],
    ],
  },
  {
    exercise: "Face Pull",
    shortName: "Face Pull",
    unit: "lb",
    levels: [
      [10, 10], [20, 28], [30, 45], [40, 62], [50, 78], [60, 88], [75, 95],
    ],
  },
];

/**
 * Given an exercise name and the weight logged, return the estimated percentile.
 * Returns null if the exercise isn't in the standards table.
 */
export function getStrengthPercentile(
  exerciseName: string,
  weight: number
): { percentile: number; shortName: string } | null {
  const std = STRENGTH_STANDARDS.find((s) => s.exercise === exerciseName);
  if (!std) return null;

  const levels = std.levels;

  if (std.invertBetter) {
    // For assist exercises: lower weight = stronger
    // levels are sorted descending by weight (high assist = weak)
    if (weight >= levels[0][0]) return { percentile: levels[0][1], shortName: std.shortName };
    if (weight <= levels[levels.length - 1][0])
      return { percentile: levels[levels.length - 1][1], shortName: std.shortName };

    // Find the two bracketing entries (weight is between two thresholds)
    for (let i = 0; i < levels.length - 1; i++) {
      const [w1, p1] = levels[i];
      const [w2, p2] = levels[i + 1];
      if (weight <= w1 && weight >= w2) {
        const ratio = (w1 - weight) / (w1 - w2);
        return { percentile: Math.round(p1 + ratio * (p2 - p1)), shortName: std.shortName };
      }
    }
    return { percentile: levels[0][1], shortName: std.shortName };
  }

  // Normal: higher weight = stronger
  if (weight <= levels[0][0]) return { percentile: levels[0][1], shortName: std.shortName };
  if (weight >= levels[levels.length - 1][0])
    return { percentile: levels[levels.length - 1][1], shortName: std.shortName };

  for (let i = 0; i < levels.length - 1; i++) {
    const [w1, p1] = levels[i];
    const [w2, p2] = levels[i + 1];
    if (weight >= w1 && weight <= w2) {
      const ratio = (weight - w1) / (w2 - w1);
      return { percentile: Math.round(p1 + ratio * (p2 - p1)), shortName: std.shortName };
    }
  }

  return { percentile: 50, shortName: std.shortName };
}
