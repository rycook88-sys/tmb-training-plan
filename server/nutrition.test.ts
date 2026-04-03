import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM and storage modules
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            foodName: "Grilled Chicken Breast with Rice",
            confidence: "high",
            servingEstimate: "1 plate, ~8oz chicken + 1 cup rice",
            calories: 520,
            protein: 48,
            carbs: 45,
            fat: 12,
            fiber: 2,
            sugar: 1,
            sodium: 380,
            micronutrients: [
              { name: "Vitamin B6", amount: "0.8mg", dailyValuePct: 47 },
              { name: "Niacin", amount: "12mg", dailyValuePct: 75 },
            ],
          }),
        },
      },
    ],
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "nutrition-photos/test123.jpg",
    url: "https://cdn.example.com/nutrition-photos/test123.jpg",
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("nutrition router", () => {
  it("analyzePhoto returns structured food analysis", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Create a small test base64 image (1x1 pixel JPEG)
    const testBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiY0SFxNREA7/2gAMAwEAAhEDEQA/AJ//2Q==";

    const result = await caller.nutrition.analyzePhoto({
      imageBase64: testBase64,
      mimeType: "image/jpeg",
    });

    expect(result).toHaveProperty("foodName");
    expect(result).toHaveProperty("calories");
    expect(result).toHaveProperty("protein");
    expect(result).toHaveProperty("carbs");
    expect(result).toHaveProperty("fat");
    expect(result).toHaveProperty("micronutrients");
    expect(result).toHaveProperty("imageUrl");
    expect(result.foodName).toBe("Grilled Chicken Breast with Rice");
    expect(result.calories).toBe(520);
    expect(result.protein).toBe(48);
    expect(Array.isArray(result.micronutrients)).toBe(true);
  });

  it("reAnalyze returns nutrition data for a corrected food name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nutrition.reAnalyze({
      foodName: "Grilled Salmon with Vegetables",
      servingEstimate: "6oz fillet + 1 cup veggies",
    });

    expect(result).toHaveProperty("foodName");
    expect(result).toHaveProperty("calories");
    expect(result).toHaveProperty("protein");
    expect(result).toHaveProperty("carbs");
    expect(result).toHaveProperty("fat");
    expect(result).toHaveProperty("micronutrients");
  });

  it("getTrends returns empty array for fewer than 3 days", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nutrition.getTrends({
      dailyLogs: [
        { date: "2026-04-01", totalCalories: 2100, totalProtein: 180, totalCarbs: 200, totalFat: 70, totalFiber: 25, totalSodium: 2000 },
        { date: "2026-04-02", totalCalories: 2300, totalProtein: 190, totalCarbs: 210, totalFat: 75, totalFiber: 28, totalSodium: 1800 },
      ],
      targets: { calories: 2300, protein: 180, carbs: 222, fat: 77 },
    });

    expect(result.recommendations).toEqual([]);
  });

  it("getTrends returns recommendations for 3+ days of data", async () => {
    // Re-mock invokeLLM for this specific test
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              recommendations: [
                {
                  id: "rec-1",
                  severity: "warning",
                  title: "Low Protein Trend",
                  message: "You've been averaging 140g protein over the last 3 days. Aim for 180g minimum.",
                  nutrient: "protein",
                },
              ],
            }),
          },
        },
      ],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nutrition.getTrends({
      dailyLogs: [
        { date: "2026-04-01", totalCalories: 2100, totalProtein: 130, totalCarbs: 200, totalFat: 70, totalFiber: 25, totalSodium: 2000 },
        { date: "2026-04-02", totalCalories: 2300, totalProtein: 140, totalCarbs: 210, totalFat: 75, totalFiber: 28, totalSodium: 1800 },
        { date: "2026-04-03", totalCalories: 2200, totalProtein: 150, totalCarbs: 190, totalFat: 72, totalFiber: 22, totalSodium: 2100 },
      ],
      targets: { calories: 2300, protein: 180, carbs: 222, fat: 77 },
    });

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].severity).toBe("warning");
    expect(result.recommendations[0].nutrient).toBe("protein");
  });
});
