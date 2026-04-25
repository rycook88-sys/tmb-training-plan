/**
 * Haptic feedback utility — uses the Vibration API on supported devices.
 * Falls back silently on unsupported browsers.
 */

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 30,
  heavy: 50,
  success: [15, 50, 15],
  error: [50, 30, 50, 30, 50],
};

export function haptic(pattern: HapticPattern = "light") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(PATTERNS[pattern]);
  }
}

/**
 * Wrap a click handler with haptic feedback.
 * Usage: onClick={withHaptic(() => doSomething(), "medium")}
 */
export function withHaptic<T extends (...args: any[]) => any>(
  fn: T,
  pattern: HapticPattern = "light"
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    haptic(pattern);
    return fn(...args);
  };
}
