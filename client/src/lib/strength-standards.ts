// Strength Standards for ~220 lb male, age 30-39
// Percentiles calibrated against the GENERAL ADULT MALE POPULATION (not gym-goers)
// Key insight: ~65% of adult males do NO resistance training (CDC/NHANES data)
// So even modest trained strength places you well above the population median.
//
// Calibration methodology:
// - Bottom 50% of gen pop = untrained/sedentary males (can't perform these lifts or use very light weight)
// - 50th-75th = men who do some physical activity but no structured lifting
// - 75th-90th = men who train casually or have trained for several months (ExRx "Novice")
// - 90th-97th = men who train consistently for 1-2+ years (ExRx "Intermediate")
// - 97th+ = advanced/competitive lifters
//
// Sources: ExRx.net standards, CDC physical activity data, NHANES participation rates

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
    // Most men can't do a controlled lateral step-down with any weight
    // Bodyweight-only is already above average; adding weight is impressive
    levels: [
      [0, 40], [10, 60], [20, 72], [30, 80], [45, 88], [60, 93], [80, 97],
    ],
  },
  {
    exercise: "Bulgarian Split Squat",
    shortName: "BSS",
    unit: "lb",
    // Single-leg exercise most untrained men cannot perform properly
    // Even bodyweight BSS requires balance/strength most lack
    levels: [
      [0, 35], [20, 55], [35, 68], [50, 78], [65, 85], [80, 91], [100, 96],
    ],
  },
  {
    exercise: "Single-Leg RDL",
    shortName: "SL-RDL",
    unit: "lb",
    // Requires balance + posterior chain strength; most men can't do bodyweight version
    levels: [
      [0, 35], [15, 55], [30, 68], [45, 78], [60, 86], [75, 92], [95, 97],
    ],
  },
  {
    exercise: "Trap Bar Deadlift",
    shortName: "Trap DL",
    unit: "lb",
    // ExRx 220 lb male: Untrained=165, Novice=305, Intermediate=350
    // Most men never deadlift; pulling 225+ puts you well above average
    levels: [
      [95, 40], [135, 55], [185, 68], [225, 76], [275, 83], [315, 88], [365, 93], [405, 96], [455, 98],
    ],
  },
  {
    exercise: "Standing Calf Raise Machine",
    shortName: "Calf Raise",
    unit: "lb",
    // Machine exercise; most men don't train calves at all
    // Even moderate weight is above gen pop since most don't do this
    levels: [
      [45, 40], [90, 55], [135, 67], [180, 76], [225, 83], [300, 90], [375, 95], [450, 98],
    ],
  },
  {
    exercise: "Hip Adduction Machine",
    shortName: "Adduction",
    unit: "lb",
    // Very few men train adductors; any meaningful weight is above average
    levels: [
      [50, 40], [90, 58], [130, 70], [170, 79], [210, 86], [260, 92], [320, 97],
    ],
  },
  {
    exercise: "Farmer Carry",
    shortName: "Farmer",
    unit: "lb",
    // Per hand weight. Most untrained men struggle with 50+ lb per hand for distance
    levels: [
      [25, 40], [40, 58], [55, 70], [70, 79], [85, 86], [100, 91], [120, 95], [140, 98],
    ],
  },
  {
    exercise: "Assisted Pull-Up",
    shortName: "Pull-Up",
    unit: "assist",
    invertBetter: true, // lower assist = stronger
    // Most men cannot do a single pull-up (studies show ~50% of men fail)
    // At 220 lb bodyweight, unassisted pull-up is very impressive
    // thresholds are assist weight; lower = better
    levels: [
      [120, 40], [100, 55], [80, 67], [60, 77], [40, 85], [20, 92], [0, 97],
    ],
  },
  {
    exercise: "Dumbbell Row",
    shortName: "DB Row",
    unit: "lb",
    // Per hand. Most untrained men can row 20-30 lb; 50+ is trained territory
    levels: [
      [20, 40], [30, 55], [40, 66], [55, 76], [70, 84], [85, 90], [100, 95], [120, 98],
    ],
  },
  {
    exercise: "Overhead Press",
    shortName: "OHP",
    unit: "lb",
    // Dumbbell OHP per hand. Most men can't press 30+ lb overhead properly
    levels: [
      [15, 40], [20, 55], [30, 67], [40, 77], [50, 85], [60, 91], [75, 96],
    ],
  },
  {
    exercise: "Face Pull",
    shortName: "Face Pull",
    unit: "lb",
    // Cable weight. Obscure exercise; anyone doing it is already in training minority
    levels: [
      [10, 50], [20, 65], [30, 76], [40, 84], [50, 90], [60, 95], [75, 98],
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
