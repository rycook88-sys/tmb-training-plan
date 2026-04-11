import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Mock LLM response using the NEW fixed-object micronutrient schema.
 * Every micronutrient field is required — the AI can no longer skip any.
 * Note: vi.mock is hoisted, so we inline the data directly.
 */

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
            sugar: 1,
            micronutrients: {
              vitamin_a_mcg: 120,
              vitamin_c_mg: 5,
              vitamin_d_mcg: 0.5,
              vitamin_e_mg: 0.8,
              vitamin_k_mcg: 2.5,
              vitamin_b6_mg: 0.8,
              vitamin_b12_mcg: 2.4,
              thiamin_b1_mg: 0.15,
              riboflavin_b2_mg: 0.2,
              niacin_b3_mg: 12,
              folate_mcg: 30,
              biotin_mcg: 5,
              pantothenic_acid_mg: 1.2,
              choline_mg: 80,
              calcium_mg: 25,
              iron_mg: 2.5,
              magnesium_mg: 40,
              phosphorus_mg: 300,
              potassium_mg: 450,
              sodium_mg: 380,
              zinc_mg: 5.5,
              copper_mg: 0.15,
              manganese_mg: 0.6,
              selenium_mcg: 35,
              chromium_mcg: 5,
              molybdenum_mcg: 10,
              iodine_mcg: 15,
              fiber_g: 2,
              omega3_epa_dha_mg: 20,
            },
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

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  const backupStore = new Map<string, string>();
  return {
    ...actual,
    upsertNutritionBackup: vi.fn().mockImplementation(async (userId: number, dataType: string, jsonData: string) => {
      backupStore.set(`${userId}:${dataType}`, jsonData);
    }),
    getNutritionBackups: vi.fn().mockImplementation(async (userId: number) => {
      const result: Record<string, string> = {};
      for (const [key, val] of backupStore.entries()) {
        if (key.startsWith(`${userId}:`)) {
          result[key.split(":")[1]] = val;
        }
      }
      return result;
    }),
  };
});

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

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "oauth",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
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
  it("analyzePhoto returns structured food analysis with all 29 micronutrients", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

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
    expect(result).toHaveProperty("fiber");
    expect(result).toHaveProperty("sodium");
    expect(result).toHaveProperty("micronutrients");
    expect(result).toHaveProperty("imageUrl");
    expect(result.foodName).toBe("Grilled Chicken Breast with Rice");
    expect(result.calories).toBe(520);
    expect(result.protein).toBe(48);

    // Verify micronutrients are returned as an array (server converts fixed-object to array)
    expect(Array.isArray(result.micronutrients)).toBe(true);
    // All 29 micronutrients should be present
    expect(result.micronutrients).toHaveLength(29);

    // Verify the array format has the correct structure
    const vitK = result.micronutrients.find((m: any) => m.name === "Vitamin K");
    expect(vitK).toBeDefined();
    expect(vitK!.amountMg).toBe(2.5);
    expect(vitK!.unit).toBe("mcg");

    // Verify fiber and sodium are extracted from the micronutrients object
    expect(result.fiber).toBe(2);
    expect(result.sodium).toBe(380);
  });

  it("reAnalyze returns all 29 micronutrients for a corrected food name", async () => {
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
    expect(result).toHaveProperty("fiber");
    expect(result).toHaveProperty("sodium");
    expect(result).toHaveProperty("micronutrients");

    // All 29 micronutrients should be present
    expect(Array.isArray(result.micronutrients)).toBe(true);
    expect(result.micronutrients).toHaveLength(29);

    // Each micronutrient should have name, amountMg, and unit
    for (const m of result.micronutrients) {
      expect(m).toHaveProperty("name");
      expect(m).toHaveProperty("amountMg");
      expect(m).toHaveProperty("unit");
      expect(typeof m.amountMg).toBe("number");
    }
  });

  it("getTrends returns empty array for zero days of data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nutrition.getTrends({
      dailyLogs: [],
      targets: { calories: 2300, protein: 180, carbs: 222, fat: 77 },
    });

    expect(result.recommendations).toEqual([]);
  });

  it("getTrends returns recommendations for 3+ days of data", async () => {
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

  it("backup saves nutrition data for authenticated user", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nutrition.backup({
      data: [
        { dataType: "foodLog", jsonData: JSON.stringify([{ date: "2026-04-01", entries: [] }]) },
        { dataType: "presets", jsonData: JSON.stringify({ workDay: [], offDay: [] }) },
        { dataType: "commonItems", jsonData: JSON.stringify([]) },
      ],
    });

    expect(result.saved).toBe(3);
    expect(result.timestamp).toBeTruthy();
  });

  it("restore returns backed-up data for authenticated user", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    // First backup
    await caller.nutrition.backup({
      data: [
        { dataType: "foodLog", jsonData: JSON.stringify([{ date: "2026-04-03", entries: [{ id: "test" }] }]) },
      ],
    });

    // Then restore
    const result = await caller.nutrition.restore();
    expect(result.backups).toHaveProperty("foodLog");
    const parsed = JSON.parse(result.backups.foodLog);
    expect(parsed[0].entries[0].id).toBe("test");
  });

  it("backup rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.nutrition.backup({ data: [{ dataType: "foodLog", jsonData: "[]" }] })
    ).rejects.toThrow();
  });

  it("analyzeText returns full analysis for clear food description", async () => {
    const { invokeLLM } = await import("./_core/llm");
    // First call: triage — no clarification needed
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ needsClarification: false, question: "" }) } }],
    });
    // Second call: full analysis
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            foodName: "Grilled Chicken Breast with Rice",
            confidence: "high",
            servingEstimate: "8oz chicken + 1 cup rice",
            calories: 520, protein: 48, carbs: 45, fat: 12, sugar: 1,
            micronutrients: {
              vitamin_a_mcg: 120, vitamin_c_mg: 5, vitamin_d_mcg: 0.5, vitamin_e_mg: 0.8,
              vitamin_k_mcg: 2.5, vitamin_b6_mg: 0.8, vitamin_b12_mcg: 2.4, thiamin_b1_mg: 0.15,
              riboflavin_b2_mg: 0.2, niacin_b3_mg: 12, folate_mcg: 30, biotin_mcg: 5,
              pantothenic_acid_mg: 1.2, choline_mg: 80, calcium_mg: 25, iron_mg: 2.5,
              magnesium_mg: 40, phosphorus_mg: 300, potassium_mg: 450, sodium_mg: 380,
              zinc_mg: 5.5, copper_mg: 0.15, manganese_mg: 0.6, selenium_mcg: 35,
              chromium_mcg: 5, molybdenum_mcg: 10, iodine_mcg: 15, fiber_g: 2, omega3_epa_dha_mg: 20,
            },
          }),
        },
      }],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.nutrition.analyzeText({ description: "8oz grilled chicken with a cup of rice" });

    expect(result.status).toBe("analyzed");
    expect((result as any).foodName).toBe("Grilled Chicken Breast with Rice");
    expect((result as any).calories).toBe(520);
    expect((result as any).protein).toBe(48);
    expect(Array.isArray((result as any).micronutrients)).toBe(true);
    expect((result as any).micronutrients).toHaveLength(29);
  });

  it("analyzeText returns clarification question for ambiguous input", async () => {
    const { invokeLLM } = await import("./_core/llm");
    // Triage: needs clarification
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ needsClarification: true, question: "How much pasta? And was it with any sauce?" }) } }],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.nutrition.analyzeText({ description: "pasta" });

    expect(result.status).toBe("clarification_needed");
    expect((result as any).question).toBe("How much pasta? And was it with any sauce?");
  });

  it("fillMyMacros returns multi-day gap analysis with deficiencies and suggestions", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            microDeficiencies: [
              { name: "Vitamin D", avgPercent: 22, severity: "critical" },
              { name: "Omega-3 (EPA+DHA)", avgPercent: 35, severity: "low" },
            ],
            macroNotes: [
              { macro: "fat", avgDaily: 55, target: 77, note: "Averaging 22g below fat target" },
            ],
            suggestions: [
              {
                foodName: "Wild Salmon Fillet",
                portion: "6oz fillet, 3x per week",
                calories: 350,
                protein: 40,
                carbs: 0,
                fat: 20,
                coversNutrients: [
                  { name: "Vitamin D", percentDV: 120 },
                  { name: "Omega-3 (EPA+DHA)", percentDV: 200 },
                ],
                reason: "Covers both your biggest micro gaps in one food.",
              },
            ],
            overallSummary: "Your biggest gaps are Vitamin D and Omega-3. Adding salmon 3x/week would cover both.",
            confidenceNote: "Based on 3 days of tracking. Accuracy improves with more data.",
          }),
        },
      }],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nutrition.fillMyMacros({
      daysTracked: 3,
      multiDayMicros: [
        { name: "Vitamin D", avgPercent: 22 },
        { name: "Omega-3 (EPA+DHA)", avgPercent: 35 },
        { name: "Vitamin C", avgPercent: 110 },
      ],
      avgMacros: { calories: 1900, protein: 160, carbs: 200, fat: 55 },
      macroTargets: { calories: 2300, protein: 180, carbs: 222, fat: 77 },
    });

    expect(result.microDeficiencies).toHaveLength(2);
    expect(result.microDeficiencies[0].name).toBe("Vitamin D");
    expect(result.microDeficiencies[0].severity).toBe("critical");
    expect(result.macroNotes).toHaveLength(1);
    expect(result.macroNotes[0].macro).toBe("fat");
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].foodName).toBe("Wild Salmon Fillet");
    expect(result.suggestions[0].coversNutrients).toHaveLength(2);
    expect(result.overallSummary).toBeTruthy();
    expect(result.confidenceNote).toBeTruthy();
  });

  it("fillMyMacros accepts mode='micros' and calorieCap params", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            microDeficiencies: [
              { name: "Iron", avgPercent: 30, severity: "low" },
            ],
            macroNotes: [],
            suggestions: [
              {
                foodName: "Spinach Salad",
                portion: "2 cups raw",
                calories: 150,
                protein: 5,
                carbs: 8,
                fat: 10,
                coversNutrients: [{ name: "Iron", percentDV: 35 }],
                reason: "Rich in iron and low calorie",
              },
            ],
            overallSummary: "Micros-only analysis found iron gap.",
            confidenceNote: "Based on 5 days.",
          }),
        },
      }],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nutrition.fillMyMacros({
      daysTracked: 5,
      multiDayMicros: [
        { name: "Iron", avgPercent: 30 },
        { name: "Vitamin C", avgPercent: 95 },
      ],
      avgMacros: { calories: 2000, protein: 170, carbs: 210, fat: 65 },
      macroTargets: { calories: 2300, protein: 180, carbs: 222, fat: 77 },
      mode: "micros",
      calorieCap: 200,
    });

    // Verify the LLM was called with micros-only instructions
    expect(invokeLLM).toHaveBeenCalled();
    const lastCall = (invokeLLM as any).mock.calls[(invokeLLM as any).mock.calls.length - 1][0];
    expect(lastCall.messages[0].content).toContain("Micronutrients ONLY");
    expect(lastCall.messages[1].content).toContain("200 calories or less");

    // macroNotes should be empty since we asked for micros only
    expect(result.macroNotes).toHaveLength(0);
    expect(result.microDeficiencies).toHaveLength(1);
    expect(result.suggestions[0].calories).toBeLessThanOrEqual(200);
  });

  it("fillMyMacros defaults mode to 'both' and calorieCap to 500", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            microDeficiencies: [],
            macroNotes: [],
            suggestions: [],
            overallSummary: "All good.",
            confidenceNote: "Based on 2 days.",
          }),
        },
      }],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Call without mode or calorieCap — should default
    await caller.nutrition.fillMyMacros({
      daysTracked: 2,
      multiDayMicros: [{ name: "Vitamin C", avgPercent: 80 }],
      avgMacros: { calories: 2100, protein: 175, carbs: 215, fat: 70 },
      macroTargets: { calories: 2300, protein: 180, carbs: 222, fat: 77 },
    });

    const lastCall = (invokeLLM as any).mock.calls[(invokeLLM as any).mock.calls.length - 1][0];
    // Default mode='both' should analyze both
    expect(lastCall.messages[0].content).toContain("BOTH macros and micronutrients");
    // Default calorieCap=500
    expect(lastCall.messages[0].content).toContain("500 calories or less");
  });

  it("MICRO_KEY_MAP covers all 29 tracked nutrients", async () => {
    const { MICRO_KEY_MAP } = await import("./nutrition");

    // Verify all 29 keys are present
    const keys = Object.keys(MICRO_KEY_MAP);
    expect(keys).toHaveLength(29);

    // Verify each key maps to a valid name and unit
    for (const [key, mapping] of Object.entries(MICRO_KEY_MAP)) {
      expect(mapping.name).toBeTruthy();
      expect(["mg", "mcg", "g"]).toContain(mapping.unit);
      expect(key.endsWith("_mg") || key.endsWith("_mcg") || key.endsWith("_g")).toBe(true);
    }

    // Verify specific important mappings
    expect(MICRO_KEY_MAP.vitamin_k_mcg).toEqual({ name: "Vitamin K", unit: "mcg" });
    expect(MICRO_KEY_MAP.fiber_g).toEqual({ name: "Fiber", unit: "g" });
    expect(MICRO_KEY_MAP.omega3_epa_dha_mg).toEqual({ name: "Omega-3 (EPA+DHA)", unit: "mg" });
  });
});
