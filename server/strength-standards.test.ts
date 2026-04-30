import { describe, it, expect } from "vitest";

// We test the strength-standards module logic directly
// Since it's a client-side module, we import the raw functions
import { getStrengthPercentile, STRENGTH_STANDARDS } from "../client/src/lib/strength-standards";

describe("Strength Standards (General Population)", () => {
  it("should have standards for all expected exercises", () => {
    const expectedExercises = [
      "Lateral Step-Down",
      "Bulgarian Split Squat",
      "Single-Leg RDL",
      "Trap Bar Deadlift",
      "Standing Calf Raise Machine",
      "Hip Adduction Machine",
      "Farmer Carry",
      "Assisted Pull-Up",
      "Dumbbell Row",
      "Overhead Press",
      "Face Pull",
    ];
    for (const name of expectedExercises) {
      const std = STRENGTH_STANDARDS.find((s) => s.exercise === name);
      expect(std, `Missing standard for ${name}`).toBeDefined();
    }
  });

  it("should return null for unknown exercises", () => {
    const result = getStrengthPercentile("Bicep Curl", 50);
    expect(result).toBeNull();
  });

  it("should return a high percentile for Trap Bar Deadlift at 335 lb (gen pop)", () => {
    const result = getStrengthPercentile("Trap Bar Deadlift", 335);
    expect(result).not.toBeNull();
    expect(result!.shortName).toBe("Trap DL");
    // 335 is between 315 (88th) and 365 (93rd) in gen pop
    expect(result!.percentile).toBeGreaterThanOrEqual(88);
    expect(result!.percentile).toBeLessThanOrEqual(93);
  });

  it("should return moderate percentile for light deadlift weight", () => {
    const result = getStrengthPercentile("Trap Bar Deadlift", 100);
    expect(result).not.toBeNull();
    // 100 lb is at/below the lowest threshold (95 at 40th percentile)
    expect(result!.percentile).toBeLessThanOrEqual(42);
  });

  it("should return very high percentile for heavy deadlift weight", () => {
    const result = getStrengthPercentile("Trap Bar Deadlift", 500);
    expect(result).not.toBeNull();
    // 500 lb is above the highest threshold (455 at 98th percentile)
    expect(result!.percentile).toBeGreaterThanOrEqual(98);
  });

  it("should handle Assisted Pull-Up (invertBetter) correctly", () => {
    // Lower assist = stronger
    const lowAssist = getStrengthPercentile("Assisted Pull-Up", 20);
    const highAssist = getStrengthPercentile("Assisted Pull-Up", 100);
    expect(lowAssist).not.toBeNull();
    expect(highAssist).not.toBeNull();
    // Lower assist weight should give higher percentile
    expect(lowAssist!.percentile).toBeGreaterThan(highAssist!.percentile);
    expect(lowAssist!.shortName).toBe("Pull-Up");
  });

  it("should interpolate between thresholds", () => {
    // Bulgarian Split Squat: 50 lb = 78th, 65 lb = 85th (gen pop)
    const result = getStrengthPercentile("Bulgarian Split Squat", 57);
    expect(result).not.toBeNull();
    // Should be between 78 and 85
    expect(result!.percentile).toBeGreaterThanOrEqual(78);
    expect(result!.percentile).toBeLessThanOrEqual(85);
    expect(result!.shortName).toBe("BSS");
  });

  it("should handle exact threshold values", () => {
    // Face Pull: 30 lb = 76th percentile exactly (gen pop)
    const result = getStrengthPercentile("Face Pull", 30);
    expect(result).not.toBeNull();
    expect(result!.percentile).toBe(76);
  });

  it("should return correct shortNames for all exercises", () => {
    const shortNames: Record<string, string> = {
      "Lateral Step-Down": "Step-Down",
      "Bulgarian Split Squat": "BSS",
      "Single-Leg RDL": "SL-RDL",
      "Trap Bar Deadlift": "Trap DL",
      "Standing Calf Raise Machine": "Calf Raise",
      "Hip Adduction Machine": "Adduction",
      "Farmer Carry": "Farmer",
      "Assisted Pull-Up": "Pull-Up",
      "Dumbbell Row": "DB Row",
      "Overhead Press": "OHP",
      "Face Pull": "Face Pull",
    };
    for (const [exercise, expectedShort] of Object.entries(shortNames)) {
      const result = getStrengthPercentile(exercise, 50);
      expect(result).not.toBeNull();
      expect(result!.shortName).toBe(expectedShort);
    }
  });

  it("should show trained individuals well above 50th percentile", () => {
    // Key validation: someone training with moderate weights should be above average
    // This is the core fix — gen pop percentiles should reflect that most men don't train
    const bss = getStrengthPercentile("Bulgarian Split Squat", 40);
    const row = getStrengthPercentile("Dumbbell Row", 45);
    const ohp = getStrengthPercentile("Overhead Press", 35);
    
    expect(bss!.percentile).toBeGreaterThan(65); // 40 lb BSS > 65th percentile gen pop
    expect(row!.percentile).toBeGreaterThan(65); // 45 lb row > 65th percentile gen pop
    expect(ohp!.percentile).toBeGreaterThan(65); // 35 lb OHP > 65th percentile gen pop
  });
});
