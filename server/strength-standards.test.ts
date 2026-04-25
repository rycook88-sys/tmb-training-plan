import { describe, it, expect } from "vitest";

// We test the strength-standards module logic directly
// Since it's a client-side module, we import the raw functions
import { getStrengthPercentile, STRENGTH_STANDARDS } from "../client/src/lib/strength-standards";

describe("Strength Standards", () => {
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

  it("should return a percentile for Trap Bar Deadlift at 335 lb", () => {
    const result = getStrengthPercentile("Trap Bar Deadlift", 335);
    expect(result).not.toBeNull();
    expect(result!.shortName).toBe("Trap DL");
    // 335 is between 315 (55th) and 365 (70th), so percentile should be ~59-63
    expect(result!.percentile).toBeGreaterThanOrEqual(55);
    expect(result!.percentile).toBeLessThanOrEqual(70);
  });

  it("should return low percentile for very light weight", () => {
    const result = getStrengthPercentile("Trap Bar Deadlift", 100);
    expect(result).not.toBeNull();
    // 100 lb is below the lowest threshold (135 at 10th percentile)
    expect(result!.percentile).toBeLessThanOrEqual(10);
  });

  it("should return high percentile for very heavy weight", () => {
    const result = getStrengthPercentile("Trap Bar Deadlift", 550);
    expect(result).not.toBeNull();
    // 550 lb is above the highest threshold (500 at 96th percentile)
    expect(result!.percentile).toBeGreaterThanOrEqual(96);
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
    // Bulgarian Split Squat: 50 lb = 45th, 60 lb = 58th
    const result = getStrengthPercentile("Bulgarian Split Squat", 55);
    expect(result).not.toBeNull();
    // Should be between 45 and 58
    expect(result!.percentile).toBeGreaterThan(45);
    expect(result!.percentile).toBeLessThan(58);
    expect(result!.shortName).toBe("BSS");
  });

  it("should handle exact threshold values", () => {
    // Face Pull: 30 lb = 45th percentile exactly
    const result = getStrengthPercentile("Face Pull", 30);
    expect(result).not.toBeNull();
    expect(result!.percentile).toBe(45);
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
});
