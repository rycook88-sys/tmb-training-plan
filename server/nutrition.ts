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
            name: { type: "string" as const },
            amount: { type: "string" as const },
            dailyValuePct: { type: "number" as const },
          },
          required: ["name", "amount", "dailyValuePct"] as const,
          additionalProperties: false as const,
        },
        description: "Notable micronutrients in this food",
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
            content: `You are a nutrition expert analyzing food photos. Identify the food and estimate macronutrients and micronutrients as accurately as possible. Be specific about portion sizes. If you see multiple food items, combine them into one total estimate. Always provide your best estimate even if uncertain — the user can correct the food name afterward. Focus on accuracy for a 226 lb male trying to lose weight on 2300 cal/day with 180g protein minimum.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text" as const,
                text: "What food is in this photo? Estimate the calories, macros, and notable micronutrients.",
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
            content: `You are a nutrition expert. The user has identified a food item. Estimate the macronutrients and micronutrients as accurately as possible. Focus on accuracy for a 226 lb male trying to lose weight on 2300 cal/day with 180g protein minimum.`,
          },
          {
            role: "user",
            content: `Estimate the nutrition for: "${input.foodName}"${input.servingEstimate ? ` (serving: ${input.servingEstimate})` : ""}. Provide calories, macros, and notable micronutrients.`,
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
});
