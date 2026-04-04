/**
 * Daily vitamin supplement data, macro targets, and micronutrient reference values.
 * All micronutrient amounts are stored in their STANDARD UNIT (the same unit as dailyValue).
 * e.g., Vitamin D is stored as 125 mcg (not 0.125 mg).
 */

/* ── Reference Daily Values (FDA 2020) ────────────────── */
export interface DailyValueRef {
  name: string;
  unit: string;        // "mg" | "mcg" | "g"
  dailyValue: number;  // FDA reference amount in the standard unit
  category: "vitamin" | "mineral" | "other";
}

/**
 * Complete list of important micronutrients with FDA Daily Values.
 * This ensures we always show all important nutrients, even at 0%.
 */
export const ALL_MICRONUTRIENTS: DailyValueRef[] = [
  // Vitamins
  { name: "Vitamin A", unit: "mcg", dailyValue: 900, category: "vitamin" },
  { name: "Vitamin C", unit: "mg", dailyValue: 90, category: "vitamin" },
  { name: "Vitamin D", unit: "mcg", dailyValue: 20, category: "vitamin" },
  { name: "Vitamin E", unit: "mg", dailyValue: 15, category: "vitamin" },
  { name: "Vitamin K", unit: "mcg", dailyValue: 120, category: "vitamin" },
  { name: "Vitamin B6", unit: "mg", dailyValue: 1.7, category: "vitamin" },
  { name: "Vitamin B12", unit: "mcg", dailyValue: 2.4, category: "vitamin" },
  { name: "Thiamin (B1)", unit: "mg", dailyValue: 1.2, category: "vitamin" },
  { name: "Riboflavin (B2)", unit: "mg", dailyValue: 1.3, category: "vitamin" },
  { name: "Niacin (B3)", unit: "mg", dailyValue: 16, category: "vitamin" },
  { name: "Folate", unit: "mcg", dailyValue: 400, category: "vitamin" },
  { name: "Biotin", unit: "mcg", dailyValue: 30, category: "vitamin" },
  { name: "Pantothenic Acid", unit: "mg", dailyValue: 5, category: "vitamin" },
  { name: "Choline", unit: "mg", dailyValue: 550, category: "vitamin" },

  // Minerals
  { name: "Calcium", unit: "mg", dailyValue: 1300, category: "mineral" },
  { name: "Iron", unit: "mg", dailyValue: 18, category: "mineral" },
  { name: "Magnesium", unit: "mg", dailyValue: 420, category: "mineral" },
  { name: "Phosphorus", unit: "mg", dailyValue: 1250, category: "mineral" },
  { name: "Potassium", unit: "mg", dailyValue: 4700, category: "mineral" },
  { name: "Sodium", unit: "mg", dailyValue: 2300, category: "mineral" },
  { name: "Zinc", unit: "mg", dailyValue: 11, category: "mineral" },
  { name: "Copper", unit: "mg", dailyValue: 0.9, category: "mineral" },
  { name: "Manganese", unit: "mg", dailyValue: 2.3, category: "mineral" },
  { name: "Selenium", unit: "mcg", dailyValue: 55, category: "mineral" },
  { name: "Chromium", unit: "mcg", dailyValue: 35, category: "mineral" },
  { name: "Molybdenum", unit: "mcg", dailyValue: 45, category: "mineral" },
  { name: "Iodine", unit: "mcg", dailyValue: 150, category: "mineral" },

  // Other important nutrients
  { name: "Fiber", unit: "g", dailyValue: 28, category: "other" },
  { name: "Omega-3 (EPA+DHA)", unit: "mg", dailyValue: 500, category: "other" },
];

/* ── Numeric Micronutrient Interface ──────────────────── */
export interface NumericMicro {
  name: string;
  amount: number;   // Amount in the STANDARD unit (same as dailyValue unit)
  unit: string;     // "mg", "mcg", or "g"
}

/* ── Vitamin Supplement Interface ─────────────────────── */
export interface VitaminSupplement {
  name: string;
  servingSize: string;
  nutrients: {
    calories: number;
    carbs: number;
    sugars: number;
    protein: number;
    fat: number;
  };
  micronutrients: NumericMicro[];
}

export const DAILY_VITAMINS: VitaminSupplement[] = [
  {
    name: "Nature Made Vitamin D3 Gummies",
    servingSize: "2 gummies",
    nutrients: { calories: 15, carbs: 3, sugars: 2, protein: 0, fat: 0 },
    micronutrients: [
      { name: "Vitamin D", amount: 125, unit: "mcg" },   // 125 mcg = 5000 IU
      { name: "Sodium", amount: 5, unit: "mg" },
    ],
  },
  {
    name: "Vitafusion Multivitamin Gummies",
    servingSize: "2 gummies",
    nutrients: { calories: 15, carbs: 4, sugars: 3, protein: 0, fat: 0 },
    micronutrients: [
      { name: "Vitamin A", amount: 790, unit: "mcg" },
      { name: "Vitamin C", amount: 33, unit: "mg" },
      { name: "Vitamin D", amount: 25, unit: "mcg" },     // 1000 IU
      { name: "Vitamin E", amount: 16.5, unit: "mg" },
      { name: "Vitamin B6", amount: 4.3, unit: "mg" },
      { name: "Folate", amount: 400, unit: "mcg" },
      { name: "Vitamin B12", amount: 7.2, unit: "mcg" },
      { name: "Biotin", amount: 30, unit: "mcg" },
      { name: "Pantothenic Acid", amount: 2.5, unit: "mg" },
      { name: "Iodine", amount: 38, unit: "mcg" },
      { name: "Zinc", amount: 3.6, unit: "mg" },
      { name: "Chromium", amount: 123, unit: "mcg" },
      { name: "Molybdenum", amount: 12, unit: "mcg" },
      { name: "Sodium", amount: 10, unit: "mg" },
    ],
  },
];

/**
 * Get combined daily vitamin totals.
 * Returns amounts in the standard unit for each nutrient.
 */
export function getDailyVitaminTotals() {
  let totalCal = 0, totalCarbs = 0, totalSugars = 0, totalProtein = 0, totalFat = 0;
  const microMap = new Map<string, number>(); // name -> total amount in standard unit

  for (const v of DAILY_VITAMINS) {
    totalCal += v.nutrients.calories;
    totalCarbs += v.nutrients.carbs;
    totalSugars += v.nutrients.sugars;
    totalProtein += v.nutrients.protein;
    totalFat += v.nutrients.fat;

    for (const m of v.micronutrients) {
      const existing = microMap.get(m.name) || 0;
      microMap.set(m.name, existing + m.amount);
    }
  }

  return {
    calories: totalCal,
    protein: totalProtein,
    carbs: totalCarbs,
    fat: totalFat,
    sugars: totalSugars,
    micronutrients: microMap,
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
  protein: 180,
  fat: 77,
  carbs: 222,
};

/**
 * Format a micronutrient amount for display.
 * Amount is in the standard unit for that nutrient.
 */
export function formatMicroAmount(name: string, amount: number): string {
  const ref = ALL_MICRONUTRIENTS.find((r) => r.name === name);
  if (!ref) return `${Math.round(amount)} mg`;

  if (ref.unit === "mcg") {
    if (amount >= 10000) return `${(amount / 1000).toFixed(1)} mg`;
    if (amount >= 100) return `${Math.round(amount)} mcg`;
    if (amount >= 1) return `${amount.toFixed(1)} mcg`;
    return `${amount.toFixed(2)} mcg`;
  }
  if (ref.unit === "g") {
    return `${amount.toFixed(1)} g`;
  }
  // mg
  if (amount >= 100) return `${Math.round(amount)} mg`;
  if (amount >= 1) return `${amount.toFixed(1)} mg`;
  return `${(amount * 1000).toFixed(0)} mcg`;
}

/**
 * Calculate % Daily Value for a micronutrient.
 * Amount must be in the standard unit (same as dailyValue).
 */
export function getMicroDVPercent(name: string, amount: number): number {
  const ref = ALL_MICRONUTRIENTS.find((r) => r.name === name);
  if (!ref || ref.dailyValue === 0) return 0;
  return Math.round((amount / ref.dailyValue) * 100);
}
