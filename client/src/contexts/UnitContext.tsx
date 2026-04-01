import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UnitSystem = "imperial" | "metric";

interface UnitContextValue {
  system: UnitSystem;
  toggle: () => void;
  isMetric: boolean;
  // Distance
  dist: (miles: number, decimals?: number) => string;
  distUnit: string;          // "mi" or "km"
  distUnitLong: string;      // "miles" or "km"
  // Elevation / height
  elev: (feet: number, decimals?: number) => string;
  elevUnit: string;          // "ft" or "m"
  elevUnitLong: string;      // "feet" or "meters"
  // Body weight
  wt: (lbs: number, decimals?: number) => string;
  wtUnit: string;            // "lb" or "kg"
  // Small weight (gear)
  oz: (ounces: number, decimals?: number) => string;
  ozUnit: string;            // "oz" or "g"
  // Temperature
  temp: (fahrenheit: number, decimals?: number) => string;
  tempUnit: string;          // "°F" or "°C"
  // Height (person)
  heightStr: (feet: number, inches: number) => string;
  // Raw converters (return numbers)
  milesToKm: (mi: number) => number;
  feetToM: (ft: number) => number;
  lbsToKg: (lb: number) => number;
  ozToG: (oz: number) => number;
  fToC: (f: number) => number;
  inToCm: (inches: number) => number;
}

const UnitContext = createContext<UnitContextValue | null>(null);

const STORAGE_KEY = "tmb_unit_system";

function loadSystem(): UnitSystem {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "metric" || v === "imperial") return v;
  } catch {}
  return "imperial";
}

export function UnitProvider({ children }: { children: ReactNode }) {
  const [system, setSystem] = useState<UnitSystem>(loadSystem);

  const toggle = useCallback(() => {
    setSystem((prev) => {
      const next = prev === "imperial" ? "metric" : "imperial";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isMetric = system === "metric";

  // Raw converters
  const milesToKm = (mi: number) => mi * 1.60934;
  const feetToM = (ft: number) => ft * 0.3048;
  const lbsToKg = (lb: number) => lb * 0.453592;
  const ozToG = (o: number) => o * 28.3495;
  const fToC = (f: number) => (f - 32) * 5 / 9;
  const inToCm = (inches: number) => inches * 2.54;

  // Formatted converters
  const dist = (miles: number, decimals = 1) =>
    isMetric ? milesToKm(miles).toFixed(decimals) : miles.toFixed(decimals);

  const elev = (feet: number, decimals = 0) =>
    isMetric ? feetToM(feet).toFixed(decimals) : feet.toLocaleString("en-US", { maximumFractionDigits: decimals });

  const wt = (lbs: number, decimals = 1) =>
    isMetric ? lbsToKg(lbs).toFixed(decimals) : lbs.toFixed(decimals);

  const oz_ = (ounces: number, decimals = 0) =>
    isMetric ? ozToG(ounces).toFixed(decimals) : ounces.toFixed(decimals);

  const temp = (fahrenheit: number, decimals = 0) =>
    isMetric ? fToC(fahrenheit).toFixed(decimals) : fahrenheit.toFixed(decimals);

  const heightStr = (feet: number, inches: number) => {
    if (isMetric) {
      const totalInches = feet * 12 + inches;
      const cm = totalInches * 2.54;
      return `${cm.toFixed(0)} cm`;
    }
    return `${feet}'${inches}"`;
  };

  const value: UnitContextValue = {
    system, toggle, isMetric,
    dist, distUnit: isMetric ? "km" : "mi", distUnitLong: isMetric ? "km" : "miles",
    elev, elevUnit: isMetric ? "m" : "ft", elevUnitLong: isMetric ? "meters" : "feet",
    wt, wtUnit: isMetric ? "kg" : "lb",
    oz: oz_, ozUnit: isMetric ? "g" : "oz",
    temp, tempUnit: isMetric ? "°C" : "°F",
    heightStr,
    milesToKm, feetToM, lbsToKg, ozToG, fToC, inToCm,
  };

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnits() {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error("useUnits must be used within UnitProvider");
  return ctx;
}
