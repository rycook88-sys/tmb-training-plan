import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { upsertNutritionBackup, getNutritionBackups } from "./db";

/**
 * Nutrition router — handles food photo analysis via LLM vision,
 * macro/micro estimation, and trend recommendations.
 *
 * MICRONUTRIENT STRATEGY:
 * Instead of a variable-length array, we use a fixed object with one property
 * per tracked nutrient. This forces the AI to return ALL 28 nutrients every time
 * because JSON schema validation rejects any missing fields.
 */

// ── Fixed micronutrient schema (one field per nutrient) ──────────────
// Each field is a number representing the amount in the nutrient's standard unit.
// The AI MUST return a value for every single one.
const micronutrientProperties = {
  vitamin_a_mcg: { type: "number" as const, description: "Vitamin A in mcg RAE" },
  vitamin_c_mg: { type: "number" as const, description: "Vitamin C in mg" },
  vitamin_d_mcg: { type: "number" as const, description: "Vitamin D in mcg" },
  vitamin_e_mg: { type: "number" as const, description: "Vitamin E in mg alpha-tocopherol" },
  vitamin_k_mcg: { type: "number" as const, description: "Vitamin K in mcg" },
  vitamin_b6_mg: { type: "number" as const, description: "Vitamin B6 in mg" },
  vitamin_b12_mcg: { type: "number" as const, description: "Vitamin B12 in mcg" },
  thiamin_b1_mg: { type: "number" as const, description: "Thiamin (B1) in mg" },
  riboflavin_b2_mg: { type: "number" as const, description: "Riboflavin (B2) in mg" },
  niacin_b3_mg: { type: "number" as const, description: "Niacin (B3) in mg" },
  folate_mcg: { type: "number" as const, description: "Folate in mcg DFE" },
  biotin_mcg: { type: "number" as const, description: "Biotin in mcg" },
  pantothenic_acid_mg: { type: "number" as const, description: "Pantothenic Acid in mg" },
  choline_mg: { type: "number" as const, description: "Choline in mg" },
  calcium_mg: { type: "number" as const, description: "Calcium in mg" },
  iron_mg: { type: "number" as const, description: "Iron in mg" },
  magnesium_mg: { type: "number" as const, description: "Magnesium in mg" },
  phosphorus_mg: { type: "number" as const, description: "Phosphorus in mg" },
  potassium_mg: { type: "number" as const, description: "Potassium in mg" },
  sodium_mg: { type: "number" as const, description: "Sodium in mg" },
  zinc_mg: { type: "number" as const, description: "Zinc in mg" },
  copper_mg: { type: "number" as const, description: "Copper in mg" },
  manganese_mg: { type: "number" as const, description: "Manganese in mg" },
  selenium_mcg: { type: "number" as const, description: "Selenium in mcg" },
  chromium_mcg: { type: "number" as const, description: "Chromium in mcg" },
  molybdenum_mcg: { type: "number" as const, description: "Molybdenum in mcg" },
  iodine_mcg: { type: "number" as const, description: "Iodine in mcg" },
  fiber_g: { type: "number" as const, description: "Dietary fiber in grams" },
  omega3_epa_dha_mg: { type: "number" as const, description: "Omega-3 (EPA+DHA) in mg" },
};

const micronutrientRequiredKeys = Object.keys(micronutrientProperties) as [string, ...string[]];

/**
 * Mapping from fixed-object keys back to display names + units.
 * Used by the frontend to convert the flat response into the FoodMicro[] format.
 */
export const MICRO_KEY_MAP: Record<string, { name: string; unit: string }> = {
  vitamin_a_mcg: { name: "Vitamin A", unit: "mcg" },
  vitamin_c_mg: { name: "Vitamin C", unit: "mg" },
  vitamin_d_mcg: { name: "Vitamin D", unit: "mcg" },
  vitamin_e_mg: { name: "Vitamin E", unit: "mg" },
  vitamin_k_mcg: { name: "Vitamin K", unit: "mcg" },
  vitamin_b6_mg: { name: "Vitamin B6", unit: "mg" },
  vitamin_b12_mcg: { name: "Vitamin B12", unit: "mcg" },
  thiamin_b1_mg: { name: "Thiamin (B1)", unit: "mg" },
  riboflavin_b2_mg: { name: "Riboflavin (B2)", unit: "mg" },
  niacin_b3_mg: { name: "Niacin (B3)", unit: "mg" },
  folate_mcg: { name: "Folate", unit: "mcg" },
  biotin_mcg: { name: "Biotin", unit: "mcg" },
  pantothenic_acid_mg: { name: "Pantothenic Acid", unit: "mg" },
  choline_mg: { name: "Choline", unit: "mg" },
  calcium_mg: { name: "Calcium", unit: "mg" },
  iron_mg: { name: "Iron", unit: "mg" },
  magnesium_mg: { name: "Magnesium", unit: "mg" },
  phosphorus_mg: { name: "Phosphorus", unit: "mg" },
  potassium_mg: { name: "Potassium", unit: "mg" },
  sodium_mg: { name: "Sodium", unit: "mg" },
  zinc_mg: { name: "Zinc", unit: "mg" },
  copper_mg: { name: "Copper", unit: "mg" },
  manganese_mg: { name: "Manganese", unit: "mg" },
  selenium_mcg: { name: "Selenium", unit: "mcg" },
  chromium_mcg: { name: "Chromium", unit: "mcg" },
  molybdenum_mcg: { name: "Molybdenum", unit: "mcg" },
  iodine_mcg: { name: "Iodine", unit: "mcg" },
  fiber_g: { name: "Fiber", unit: "g" },
  omega3_epa_dha_mg: { name: "Omega-3 (EPA+DHA)", unit: "mg" },
};

const foodAnalysisSchema = {
  name: "food_analysis",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      foodName: {
        type: "string" as const,
        description: "Name of the identified food item(s), e.g. 'Grilled Chicken Breast with Rice'",
      },
      confidence: {
        type: "string" as const,
        enum: ["high", "medium", "low"],
        description: "How confident the model is in the identification",
      },
      servingEstimate: {
        type: "string" as const,
        description: "Estimated serving size, e.g. '1 plate, ~8oz chicken + 1 cup rice'",
      },
      calories: { type: "number" as const, description: "Estimated total calories" },
      protein: { type: "number" as const, description: "Grams of protein" },
      carbs: { type: "number" as const, description: "Grams of carbohydrates" },
      fat: { type: "number" as const, description: "Grams of fat" },
      sugar: { type: "number" as const, description: "Grams of sugar" },
      micronutrients: {
        type: "object" as const,
        properties: micronutrientProperties,
        required: micronutrientRequiredKeys,
        additionalProperties: false as const,
        description: "ALL 29 micronutrients. Every field is REQUIRED. Use 0 if the nutrient is truly absent from this food. Fiber and sodium are included here — do NOT duplicate them at the top level.",
      },
    },
    required: [
      "foodName", "confidence", "servingEstimate",
      "calories", "protein", "carbs", "fat",
      "sugar", "micronutrients",
    ] as const,
    additionalProperties: false as const,
  },
};

const FOOD_ANALYSIS_SYSTEM_PROMPT = `You are a nutrition expert analyzing food. Identify the food and estimate macronutrients and ALL micronutrients as accurately as possible.

CRITICAL INSTRUCTIONS:
1. INGREDIENT-LEVEL ANALYSIS: Mentally break down the meal into individual ingredients. For each ingredient, estimate its nutrient contribution, then SUM them all together.
   Example: "Chicken breast with broccoli and rice" → analyze chicken (protein, B vitamins, selenium), broccoli (Vitamin K, Vitamin C, fiber, folate), rice (carbs, manganese, selenium) separately, then add up.

2. ALL 29 MICRONUTRIENTS ARE REQUIRED: The response schema has 29 fixed micronutrient fields. You MUST provide a number for EVERY SINGLE ONE. Use 0 only if the nutrient is genuinely absent from ALL ingredients.

3. DO NOT SKIP NUTRIENTS: Common mistakes to avoid:
   - Broccoli → MUST include vitamin_k_mcg (1 cup cooked ≈ 220 mcg)
   - Meat → MUST include iron, zinc, B12, selenium, phosphorus
   - Dairy → MUST include calcium, phosphorus, vitamin A, riboflavin
   - Potatoes → MUST include potassium, vitamin C, B6, manganese
   - Eggs → MUST include choline, selenium, vitamin D, B12

4. NUMERIC VALUES ONLY: Every micronutrient field must be a specific number. Never use 0 as a lazy default — if the food likely contains the nutrient, estimate it.

5. UNITS: Each field name includes the unit (e.g., vitamin_k_mcg means the value is in micrograms). Fiber is in grams. Most minerals are in mg.

Focus on accuracy for a 226 lb male trying to lose weight on 2300 cal/day with 180g protein minimum.`;

const trendRecommendationSchema = {
  name: "trend_recommendations",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      recommendations: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            id: { type: "string" as const, description: "Unique ID for this recommendation" },
            severity: {
              type: "string" as const,
              enum: ["info", "warning", "action"],
              description: "info = nice to know, warning = trending bad, action = needs attention",
            },
            title: { type: "string" as const, description: "Short headline" },
            message: { type: "string" as const, description: "Actionable recommendation, 1-2 sentences" },
            nutrient: { type: "string" as const, description: "Which nutrient this is about" },
          },
          required: ["id", "severity", "title", "message", "nutrient"] as const,
          additionalProperties: false as const,
        },
      },
    },
    required: ["recommendations"] as const,
    additionalProperties: false as const,
  },
};

const fillMacrosSuggestionSchema = {
  name: "fill_macros_suggestions",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      suggestions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            foodName: { type: "string" as const, description: "Specific food item name" },
            portion: { type: "string" as const, description: "Suggested portion size" },
            calories: { type: "number" as const },
            protein: { type: "number" as const },
            carbs: { type: "number" as const },
            fat: { type: "number" as const },
            reason: { type: "string" as const, description: "Why this food helps fill the gap, 1 sentence" },
          },
          required: ["foodName", "portion", "calories", "protein", "carbs", "fat", "reason"] as const,
          additionalProperties: false as const,
        },
      },
      summary: { type: "string" as const, description: "One-sentence summary of the suggestion strategy" },
    },
    required: ["suggestions", "summary"] as const,
    additionalProperties: false as const,
  },
};

/**
 * Convert the fixed-object micronutrient response into the FoodMicro[] array
 * format used by the frontend. This runs server-side so the frontend doesn't
 * need to know about the schema change.
 */
function convertMicrosToArray(micros: Record<string, number>): Array<{ name: string; amountMg: number; unit: string }> {
  const result: Array<{ name: string; amountMg: number; unit: string }> = [];
  for (const [key, mapping] of Object.entries(MICRO_KEY_MAP)) {
    const value = micros[key];
    if (typeof value === "number") {
      result.push({ name: mapping.name, amountMg: value, unit: mapping.unit });
    }
  }
  return result;
}

export const nutritionRouter = router({
  /**
   * Analyze a food photo — accepts base64 image data,
   * uploads to S3, sends to LLM vision, returns food identification + macros
   */
  analyzePhoto: publicProcedure
    .input(
      z.object({
        imageBase64: z.string().describe("Base64-encoded image data (without data URI prefix)"),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      // Upload image to S3 for the LLM to access
      const imageBuffer = Buffer.from(input.imageBase64, "base64");
      const fileKey = `nutrition-photos/${nanoid()}.${input.mimeType === "image/png" ? "png" : "jpg"}`;
      const { url: imageUrl } = await storagePut(fileKey, imageBuffer, input.mimeType);

      // Call LLM with vision
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: FOOD_ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "text" as const,
                text: "What food is in this photo? Estimate the calories, macros, and ALL 29 micronutrients. Remember: break down each ingredient separately, then sum the nutrients. Every micronutrient field must have a value.",
              },
              {
                type: "image_url" as const,
                image_url: {
                  url: imageUrl,
                  detail: "high" as const,
                },
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: foodAnalysisSchema,
        },
      });

      const rawContent = result.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      if (!content) {
        throw new Error("No response from food analysis model");
      }

      const parsed = JSON.parse(content);

      // Convert fixed-object micros to array format for frontend compatibility
      const microArray = convertMicrosToArray(parsed.micronutrients);

      return {
        foodName: parsed.foodName,
        confidence: parsed.confidence,
        servingEstimate: parsed.servingEstimate,
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        fiber: parsed.micronutrients.fiber_g || 0,
        sugar: parsed.sugar,
        sodium: parsed.micronutrients.sodium_mg || 0,
        micronutrients: microArray,
        imageUrl,
      };
    }),

  /**
   * Re-analyze with a corrected food name — if the user edits the food name,
   * we re-estimate the macros based on the corrected name.
   */
  reAnalyze: publicProcedure
    .input(
      z.object({
        foodName: z.string(),
        servingEstimate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: FOOD_ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Estimate the nutrition for: "${input.foodName}"${input.servingEstimate ? ` (serving: ${input.servingEstimate})` : ""}. Break down each ingredient separately, then sum the nutrients. Every micronutrient field must have a value.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: foodAnalysisSchema,
        },
      });

      const rawContent = result.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      if (!content) {
        throw new Error("No response from nutrition model");
      }

      const parsed = JSON.parse(content);

      // Convert fixed-object micros to array format for frontend compatibility
      const microArray = convertMicrosToArray(parsed.micronutrients);

      return {
        foodName: parsed.foodName,
        confidence: parsed.confidence,
        servingEstimate: parsed.servingEstimate,
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        fiber: parsed.micronutrients.fiber_g || 0,
        sugar: parsed.sugar,
        sodium: parsed.micronutrients.sodium_mg || 0,
        micronutrients: microArray,
      };
    }),

  /**
   * Generate trend recommendations based on the last 3 days of food logs.
   * Only flags real patterns, not one-off misses.
   */
  getTrends: publicProcedure
    .input(
      z.object({
        dailyLogs: z.array(
          z.object({
            date: z.string(),
            totalCalories: z.number(),
            totalProtein: z.number(),
            totalCarbs: z.number(),
            totalFat: z.number(),
            totalFiber: z.number(),
            totalSodium: z.number(),
            micronutrientSummary: z.string().optional(),
          })
        ),
        targets: z.object({
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fat: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      if (input.dailyLogs.length === 0) {
        return { recommendations: [] };
      }

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a nutrition coach for a 226 lb male training for a 10-day alpine hike (Tour du Mont Blanc). He's trying to lose weight on ${input.targets.calories} cal/day with ${input.targets.protein}g protein minimum. 

IMPORTANT RULES:
- If there are 3+ days of data, flag TRENDS over multiple days, not single-day misses
- If there are fewer than 3 days, give preliminary observations based on available data
- Don't be annoying about small variations (within 20% is fine)
- Focus on patterns that actually matter for health and training performance
- Be direct and actionable, not preachy
- Maximum 3 recommendations
- If everything looks good, return an empty array — don't force recommendations`,
          },
          {
            role: "user",
            content: `Here are the last ${input.dailyLogs.length} days of nutrition data:\n\n${JSON.stringify(input.dailyLogs, null, 2)}\n\nTargets: ${JSON.stringify(input.targets)}\n\nAny trends worth flagging?`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: trendRecommendationSchema,
        },
      });

      const rawContent = result.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      if (!content) {
        return { recommendations: [] };
      }

      return JSON.parse(content);
    }),

  /**
   * Fill My Macros — suggest specific foods to close remaining macro gaps.
   * Only available after 3+ days of tracking.
   */
  fillMyMacros: publicProcedure
    .input(
      z.object({
        remainingCalories: z.number(),
        remainingProtein: z.number(),
        remainingCarbs: z.number(),
        remainingFat: z.number(),
        timeOfDay: z.string(),
        daysTracked: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // No minimum day requirement — manual button press overrides any wait

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a practical nutrition advisor for a 226 lb male losing weight on 2300 cal/day with 180g protein minimum. He's training for a 10-day alpine hike.

Suggest 2-4 specific, realistic foods that would help fill his remaining macro gaps for the day. Consider the time of day — don't suggest a full dinner at breakfast time. Prioritize closing the biggest gap (usually protein). Keep suggestions practical and easy to prepare.`,
          },
          {
            role: "user",
            content: `It's ${input.timeOfDay}. I still need to eat:
- ${Math.round(input.remainingCalories)} more calories
- ${Math.round(input.remainingProtein)}g more protein
- ${Math.round(input.remainingCarbs)}g more carbs
- ${Math.round(input.remainingFat)}g more fat

What should I eat to close these gaps?`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: fillMacrosSuggestionSchema,
        },
      });

      const rawContent = result.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      if (!content) {
        return { suggestions: [], summary: "Could not generate suggestions." };
      }

      return JSON.parse(content);
    }),

  /**
   * Backup nutrition data from localStorage to the database.
   * Accepts multiple data types in one call for efficiency.
   */
  backup: protectedProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            dataType: z.string(),
            jsonData: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      let saved = 0;
      for (const item of input.data) {
        await upsertNutritionBackup(userId, item.dataType, item.jsonData);
        saved++;
      }
      return { saved, timestamp: new Date().toISOString() };
    }),

  /**
   * Restore nutrition data from the database.
   * Returns all backed-up data types for the current user.
   */
  restore: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const backups = await getNutritionBackups(userId);
      return { backups, timestamp: new Date().toISOString() };
    }),
});
