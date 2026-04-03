/**
 * Daily vitamin supplement data — auto-added each day.
 * Extracted from user's actual supplement labels.
 */

export interface VitaminSupplement {
  name: string;
  servingSize: string;
  nutrients: {
    calories: number;
    carbs: number;       // grams
    sugars: number;      // grams
    protein: number;     // grams
    fat: number;         // grams
  };
  micronutrients: MicroNutrient[];
}

export interface MicroNutrient {
  name: string;
  amount: string;       // e.g. "5000 IU", "33 mg"
  dailyValuePct: number; // percentage of daily value
}

export const DAILY_VITAMINS: VitaminSupplement[] = [
  {
    name: "Nature Made Vitamin D3 Gummies",
    servingSize: "2 gummies",
    nutrients: {
      calories: 15,
      carbs: 3,
      sugars: 2,
      protein: 0,
      fat: 0,
    },
    micronutrients: [
      { name: "Vitamin D3", amount: "125 mcg (5000 IU)", dailyValuePct: 625 },
      { name: "Sodium", amount: "5 mg", dailyValuePct: 1 },
    ],
  },
  {
    name: "Vitafusion Multivitamin Gummies",
    servingSize: "2 gummies",
    nutrients: {
      calories: 15,
      carbs: 4,
      sugars: 3,
      protein: 0,
      fat: 0,
    },
    micronutrients: [
      { name: "Vitamin A", amount: "790 mcg RAE", dailyValuePct: 88 },
      { name: "Vitamin C", amount: "33 mg", dailyValuePct: 37 },
      { name: "Vitamin D3", amount: "25 mcg (1000 IU)", dailyValuePct: 125 },
      { name: "Vitamin E", amount: "16.5 mg", dailyValuePct: 110 },
      { name: "Vitamin B6", amount: "4.3 mg", dailyValuePct: 253 },
      { name: "Folate", amount: "400 mcg DFE", dailyValuePct: 100 },
      { name: "Vitamin B12", amount: "7.2 mcg", dailyValuePct: 300 },
      { name: "Biotin", amount: "30 mcg", dailyValuePct: 100 },
      { name: "Pantothenic Acid", amount: "2.5 mg", dailyValuePct: 50 },
      { name: "Iodine", amount: "38 mcg", dailyValuePct: 25 },
      { name: "Zinc", amount: "3.6 mg", dailyValuePct: 35 },
      { name: "Chromium", amount: "123 mcg", dailyValuePct: 351 },
      { name: "Molybdenum", amount: "12 mcg", dailyValuePct: 27 },
      { name: "Sodium", amount: "10 mg", dailyValuePct: 1 },
      { name: "Boron", amount: "150 mcg", dailyValuePct: 0 },
    ],
  },
];

/**
 * Get combined daily vitamin totals
 */
export function getDailyVitaminTotals() {
  let totalCal = 0, totalCarbs = 0, totalSugars = 0, totalProtein = 0, totalFat = 0;
  const microMap = new Map<string, { amount: string; dailyValuePct: number }>();

  for (const v of DAILY_VITAMINS) {
    totalCal += v.nutrients.calories;
    totalCarbs += v.nutrients.carbs;
    totalSugars += v.nutrients.sugars;
    totalProtein += v.nutrients.protein;
    totalFat += v.nutrients.fat;

    for (const m of v.micronutrients) {
      const existing = microMap.get(m.name);
      if (existing) {
        // Combine daily value percentages for same nutrient
        microMap.set(m.name, {
          amount: `${existing.amount} + ${m.amount}`,
          dailyValuePct: existing.dailyValuePct + m.dailyValuePct,
        });
      } else {
        microMap.set(m.name, { amount: m.amount, dailyValuePct: m.dailyValuePct });
      }
    }
  }

  return {
    calories: totalCal,
    protein: totalProtein,
    carbs: totalCarbs,
    fat: totalFat,
    sugars: totalSugars,
    micronutrients: Array.from(microMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      dailyValuePct: data.dailyValuePct,
    })),
  };
}

/**
 * Macro targets for the user
 * 2300 cal, 180g protein minimum
 * Weight loss split: high protein, moderate fat, lower carbs
 * Protein: 180g = 720 cal (31%)
 * Fat: 77g = 693 cal (30%)
 * Carbs: 222g = 887 cal (39%)
 */
export const MACRO_TARGETS = {
  calories: 2300,
  protein: 180,   // grams
  fat: 77,        // grams
  carbs: 222,     // grams
};
