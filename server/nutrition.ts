import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

/**
 * Nutrition router — handles food photo analysis via LLM vision,
 * macro/micro estimation, and trend recommendations.
 */

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
      fiber: { type: "number" as const, description: "Grams of fiber" },
      sugar: { type: "number" as const, description: "Grams of sugar" },
      sodium: { type: "number" as const, description: "Milligrams of sodium" },
      micronutrients: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: {
              type: "string" as const,
              description: "Nutrient name. MUST match one of: Vitamin A, Vitamin C, Vitamin D, Vitamin E, Vitamin K, Vitamin B6, Vitamin B12, Thiamin (B1), Riboflavin (B2), Niacin (B3), Folate, Biotin, Pantothenic Acid, Choline, Calcium, Iron, Magnesium, Phosphorus, Potassium, Zinc, Copper, Manganese, Selenium, Chromium, Molybdenum, Iodine, Fiber, Omega-3 (EPA+DHA)",
            },
            amountMg: {
              type: "number" as const,
              description: "Amount in the standard unit for this nutrient. For nutrients measured in mg, provide mg. For nutrients measured in mcg (Vitamin A, Vitamin D, Vitamin K, Vitamin B12, Folate, Biotin, Selenium, Chromium, Molybdenum, Iodine), provide the value in mcg. For fiber (measured in g), provide grams. MUST be a specific number, never 0 unless truly absent.",
            },
            unit: {
              type: "string" as const,
              enum: ["mg", "mcg", "g"],
              description: "The unit of the amountMg value",
            },
          },
          required: ["name", "amountMg", "unit"] as const,
          additionalProperties: false as const,
        },
        description: "ALL micronutrients present in this food. Include every nutrient you can estimate, even small amounts. Use exact numeric values only — never use words like 'Moderate' or 'High'. If unsure of exact amount, provide your best numeric estimate.",
      },
    },
    required: [
      "foodName", "confidence", "servingEstimate",
      "calories", "protein", "carbs", "fat",
      "fiber", "sugar", "sodium", "micronutrients",
    ] as const,
    additionalProperties: false as const,
  },
};

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
            content: `You are a nutrition expert analyzing food photos. Identify the food and estimate macronutrients and micronutrients as accurately as possible. Be specific about portion sizes. If you see multiple food items, combine them into one total estimate. Always provide your best estimate even if uncertain — the user can correct the food name afterward. Focus on accuracy for a 226 lb male trying to lose weight on 2300 cal/day with 180g protein minimum.

CRITICAL RULES FOR MICRONUTRIENTS:
- ALWAYS return NUMERIC values for micronutrient amounts. NEVER use words like "Moderate", "High", "Low", or "Trace".
- If you're unsure of the exact amount, provide your BEST NUMERIC ESTIMATE.
- Include ALL micronutrients you can reasonably estimate for the food.
- Use the correct unit: mcg for Vitamin A, D, K, B12, Folate, Biotin, Selenium, Chromium, Molybdenum, Iodine. mg for most minerals and vitamins. g for Fiber.
- The amountMg field should contain the value in the unit specified by the unit field.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text" as const,
                text: "What food is in this photo? Estimate the calories, macros, and ALL micronutrients with specific numeric amounts.",
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
      return {
        ...parsed,
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
            content: `You are a nutrition expert. The user has identified a food item. Estimate the macronutrients and micronutrients as accurately as possible. Focus on accuracy for a 226 lb male trying to lose weight on 2300 cal/day with 180g protein minimum.

CRITICAL RULES FOR MICRONUTRIENTS:
- ALWAYS return NUMERIC values for micronutrient amounts. NEVER use words like "Moderate", "High", "Low", or "Trace".
- If you're unsure of the exact amount, provide your BEST NUMERIC ESTIMATE.
- Include ALL micronutrients you can reasonably estimate for the food.
- Use the correct unit: mcg for Vitamin A, D, K, B12, Folate, Biotin, Selenium, Chromium, Molybdenum, Iodine. mg for most minerals and vitamins. g for Fiber.`,
          },
          {
            role: "user",
            content: `Estimate the nutrition for: "${input.foodName}"${input.servingEstimate ? ` (serving: ${input.servingEstimate})` : ""}. Provide calories, macros, and ALL micronutrients with specific numeric amounts.`,
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

      return JSON.parse(content);
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
      if (input.dailyLogs.length < 3) {
        return { recommendations: [] };
      }

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a nutrition coach for a 226 lb male training for a 10-day alpine hike (Tour du Mont Blanc). He's trying to lose weight on ${input.targets.calories} cal/day with ${input.targets.protein}g protein minimum. 

IMPORTANT RULES:
- Only flag TRENDS over 3+ days, not single-day misses
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
      if (input.daysTracked < 3) {
        return {
          suggestions: [],
          summary: "Need at least 3 days of tracking data before suggesting foods.",
        };
      }

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
});
