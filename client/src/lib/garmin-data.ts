// ============================================================
// Garmin Activity Data — Parsed from 36 FIT files (Feb 1 – Mar 24, 2026)
// Zone calculation: %HRR method
//   Max HR: 196, Resting HR: 56, HRR: 140
//   Z1: 126–140  Z2: 140–154  Z3: 154–168  Z4: 168–182  Z5: 182–196
// ============================================================

export interface GarminSession {
  id: string;
  date: string;
  type: "CARDIO" | "STRENGTH" | "STAIR STEPPER" | "YOGA" | "HIKE";
  duration_min: number;
  avg_hr: number;
  max_hr: number;
  calories: number;
  distance_mi: number;
  elevation_gain: number;
  elevation_loss: number;
  drift: number;
  below_z1: number;
  z1_pct: number;
  z2_pct: number;
  z3_pct: number;
  z4_pct: number;
  z5_pct: number;
}

export const GARMIN_SESSIONS: GarminSession[] = [
  { id: "21733114176", date: "2026-02-01", type: "CARDIO", duration_min: 85, avg_hr: 140.4, max_hr: 191, calories: 1008, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -19.8, below_z1: 29.5, z1_pct: 26.0, z2_pct: 15.9, z3_pct: 10.6, z4_pct: 18.1, z5_pct: 0.0 },
  { id: "21744133423", date: "2026-02-02", type: "STRENGTH", duration_min: 104, avg_hr: 131.4, max_hr: 173, calories: 1112, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -21.6, below_z1: 34.8, z1_pct: 25.8, z2_pct: 27.3, z3_pct: 11.8, z4_pct: 0.3, z5_pct: 0.0 },
  { id: "21747025034", date: "2026-02-03", type: "CARDIO", duration_min: 67, avg_hr: 143.0, max_hr: 179, calories: 850, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -24.5, below_z1: 18.3, z1_pct: 32.3, z2_pct: 22.6, z3_pct: 7.9, z4_pct: 18.9, z5_pct: 0.0 },
  { id: "21756663252", date: "2026-02-03", type: "STRENGTH", duration_min: 70, avg_hr: 141.8, max_hr: 181, calories: 909, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -12.2, below_z1: 8.2, z1_pct: 37.6, z2_pct: 35.6, z3_pct: 17.0, z4_pct: 1.5, z5_pct: 0.0 },
  { id: "21781246435", date: "2026-02-06", type: "CARDIO", duration_min: 46, avg_hr: 141.7, max_hr: 164, calories: 706, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 6.5, below_z1: 18.8, z1_pct: 14.9, z2_pct: 37.6, z3_pct: 28.7, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21816874761", date: "2026-02-09", type: "STRENGTH", duration_min: 81, avg_hr: 134.8, max_hr: 173, calories: 976, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -3.3, below_z1: 25.2, z1_pct: 37.4, z2_pct: 30.5, z3_pct: 6.9, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21818774459", date: "2026-02-09", type: "CARDIO", duration_min: 56, avg_hr: 117.6, max_hr: 169, calories: 531, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 2.8, below_z1: 90.4, z1_pct: 7.2, z2_pct: 0.8, z3_pct: 0.8, z4_pct: 0.8, z5_pct: 0.0 },
  { id: "21827593127", date: "2026-02-10", type: "CARDIO", duration_min: 66, avg_hr: 149.2, max_hr: 168, calories: 1099, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 5.3, below_z1: 6.7, z1_pct: 12.7, z2_pct: 35.8, z3_pct: 44.8, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21838541870", date: "2026-02-11", type: "STRENGTH", duration_min: 79, avg_hr: 125.7, max_hr: 168, calories: 834, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -5.0, below_z1: 46.8, z1_pct: 32.9, z2_pct: 17.7, z3_pct: 2.5, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21889985091", date: "2026-02-16", type: "CARDIO", duration_min: 148, avg_hr: 147.7, max_hr: 196, calories: 2068, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 4.0, below_z1: 7.1, z1_pct: 17.2, z2_pct: 39.6, z3_pct: 30.6, z4_pct: 4.4, z5_pct: 1.1 },
  { id: "21891647944", date: "2026-02-17", type: "CARDIO", duration_min: 36, avg_hr: 122.6, max_hr: 161, calories: 416, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 5.2, below_z1: 46.2, z1_pct: 51.6, z2_pct: 0.0, z3_pct: 2.2, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21901409292", date: "2026-02-17", type: "STRENGTH", duration_min: 57, avg_hr: 134.1, max_hr: 172, calories: 732, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -1.2, below_z1: 24.3, z1_pct: 42.2, z2_pct: 27.2, z3_pct: 5.2, z4_pct: 1.2, z5_pct: 0.0 },
  { id: "21920388091", date: "2026-02-19", type: "CARDIO", duration_min: 66, avg_hr: 138.8, max_hr: 157, calories: 947, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 0.2, below_z1: 14.1, z1_pct: 23.0, z2_pct: 62.2, z3_pct: 0.7, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21953297253", date: "2026-02-22", type: "STRENGTH", duration_min: 110, avg_hr: 132.4, max_hr: 176, calories: 1185, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -3.6, below_z1: 33.5, z1_pct: 29.4, z2_pct: 26.7, z3_pct: 10.1, z4_pct: 0.3, z5_pct: 0.0 },
  { id: "21960633466", date: "2026-02-23", type: "YOGA", duration_min: 59, avg_hr: 91.3, max_hr: 124, calories: 301, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -3.6, below_z1: 100.0, z1_pct: 0.0, z2_pct: 0.0, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21961471655", date: "2026-02-23", type: "STAIR STEPPER", duration_min: 65, avg_hr: 142.7, max_hr: 161, calories: 978, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 7.0, below_z1: 5.4, z1_pct: 15.5, z2_pct: 72.1, z3_pct: 7.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21975093361", date: "2026-02-24", type: "STRENGTH", duration_min: 82, avg_hr: 122.7, max_hr: 171, calories: 812, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -6.9, below_z1: 56.9, z1_pct: 26.9, z2_pct: 12.6, z3_pct: 2.4, z4_pct: 1.2, z5_pct: 0.0 },
  { id: "21982585306", date: "2026-02-25", type: "STAIR STEPPER", duration_min: 65, avg_hr: 139.1, max_hr: 154, calories: 937, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 5.2, below_z1: 11.3, z1_pct: 23.3, z2_pct: 65.4, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "21983343081", date: "2026-02-25", type: "YOGA", duration_min: 54, avg_hr: 90.7, max_hr: 125, calories: 278, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -5.4, below_z1: 100.0, z1_pct: 0.0, z2_pct: 0.0, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22027589463", date: "2026-02-28", type: "STAIR STEPPER", duration_min: 67, avg_hr: 139.8, max_hr: 163, calories: 997, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 5.9, below_z1: 16.4, z1_pct: 17.2, z2_pct: 61.2, z3_pct: 5.2, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22030158843", date: "2026-03-01", type: "STRENGTH", duration_min: 128, avg_hr: 110.7, max_hr: 168, calories: 1098, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 1.6, below_z1: 74.0, z1_pct: 16.9, z2_pct: 7.6, z3_pct: 1.2, z4_pct: 0.2, z5_pct: 0.0 },
  { id: "22040385391", date: "2026-03-02", type: "CARDIO", duration_min: 96, avg_hr: 140.3, max_hr: 156, calories: 1312, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 3.6, below_z1: 8.5, z1_pct: 17.9, z2_pct: 73.6, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22049005256", date: "2026-03-03", type: "YOGA", duration_min: 64, avg_hr: 83.9, max_hr: 130, calories: 264, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 10.4, below_z1: 100.0, z1_pct: 0.0, z2_pct: 0.0, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22050648296", date: "2026-03-03", type: "STRENGTH", duration_min: 114, avg_hr: 139.2, max_hr: 180, calories: 1355, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -3.5, below_z1: 17.3, z1_pct: 38.9, z2_pct: 25.3, z3_pct: 16.4, z4_pct: 2.2, z5_pct: 0.0 },
  { id: "22108732711", date: "2026-03-08", type: "STRENGTH", duration_min: 85, avg_hr: 132.7, max_hr: 172, calories: 952, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -12.4, below_z1: 35.7, z1_pct: 29.4, z2_pct: 22.4, z3_pct: 11.0, z4_pct: 1.6, z5_pct: 0.0 },
  { id: "22116563008", date: "2026-03-09", type: "CARDIO", duration_min: 66, avg_hr: 151.6, max_hr: 173, calories: 1101, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 12.0, below_z1: 6.5, z1_pct: 12.3, z2_pct: 26.8, z3_pct: 44.9, z4_pct: 9.4, z5_pct: 0.0 },
  { id: "22120284505", date: "2026-03-09", type: "HIKE", duration_min: 87, avg_hr: 124.7, max_hr: 166, calories: 897, distance_mi: 3.92, elevation_gain: 711, elevation_loss: 702, drift: 7.2, below_z1: 59.0, z1_pct: 18.7, z2_pct: 13.7, z3_pct: 8.6, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22132124523", date: "2026-03-10", type: "STRENGTH", duration_min: 93, avg_hr: 116.1, max_hr: 153, calories: 795, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -15.0, below_z1: 66.1, z1_pct: 25.2, z2_pct: 8.8, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22132127001", date: "2026-03-10", type: "HIKE", duration_min: 106, avg_hr: 117.1, max_hr: 164, calories: 987, distance_mi: 12.5, elevation_gain: 1133, elevation_loss: 1427, drift: -11.6, below_z1: 70.9, z1_pct: 13.1, z2_pct: 11.7, z3_pct: 4.2, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22133662771", date: "2026-03-11", type: "CARDIO", duration_min: 67, avg_hr: 138.5, max_hr: 152, calories: 947, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -3.5, below_z1: 17.1, z1_pct: 12.9, z2_pct: 70.0, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22143113559", date: "2026-03-11", type: "CARDIO", duration_min: 114, avg_hr: 134.2, max_hr: 178, calories: 1386, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -1.7, below_z1: 23.3, z1_pct: 38.8, z2_pct: 33.9, z3_pct: 1.2, z4_pct: 2.9, z5_pct: 0.0 },
  { id: "22165359568", date: "2026-03-14", type: "CARDIO", duration_min: 64, avg_hr: 124.2, max_hr: 138, calories: 713, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 3.9, below_z1: 40.6, z1_pct: 59.4, z2_pct: 0.0, z3_pct: 0.0, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22195337964", date: "2026-03-16", type: "STRENGTH", duration_min: 131, avg_hr: 141.8, max_hr: 204, calories: 1595, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 2.9, below_z1: 15.7, z1_pct: 26.2, z2_pct: 35.2, z3_pct: 17.6, z4_pct: 4.2, z5_pct: 1.0 },
  { id: "22243589754", date: "2026-03-21", type: "CARDIO", duration_min: 66, avg_hr: 139.1, max_hr: 161, calories: 968, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 12.7, below_z1: 10.6, z1_pct: 38.7, z2_pct: 37.3, z3_pct: 13.4, z4_pct: 0.0, z5_pct: 0.0 },
  { id: "22274431152", date: "2026-03-23", type: "STRENGTH", duration_min: 97, avg_hr: 129.8, max_hr: 173, calories: 1018, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: -3.5, below_z1: 38.6, z1_pct: 34.3, z2_pct: 17.2, z3_pct: 9.2, z4_pct: 0.7, z5_pct: 0.0 },
  { id: "22286227603", date: "2026-03-24", type: "CARDIO", duration_min: 69, avg_hr: 148.6, max_hr: 173, calories: 1099, distance_mi: 0, elevation_gain: 0, elevation_loss: 0, drift: 8.3, below_z1: 6.8, z1_pct: 16.4, z2_pct: 40.4, z3_pct: 29.5, z4_pct: 6.8, z5_pct: 0.0 },
];

export const WEEKLY_VOLUME: Record<string, { cardio: number; strength: number; yoga: number; hike: number; total: number }> = {
  "W05 (Feb 1)":  { cardio: 198, strength: 174, yoga: 0, hike: 0, total: 372 },
  "W06 (Feb 8)":  { cardio: 122, strength: 160, yoga: 0, hike: 0, total: 282 },
  "W07 (Feb 15)": { cardio: 250, strength: 57,  yoga: 0, hike: 0, total: 307 },
  "W08 (Feb 22)": { cardio: 197, strength: 192, yoga: 113, hike: 0, total: 502 },
  "W09 (Mar 1)":  { cardio: 96,  strength: 242, yoga: 64, hike: 0, total: 402 },
  "W10 (Mar 8)":  { cardio: 311, strength: 178, yoga: 0, hike: 193, total: 682 },
  "W11 (Mar 15)": { cardio: 66,  strength: 131, yoga: 0, hike: 0, total: 197 },
  "W12 (Mar 22)": { cardio: 69,  strength: 97,  yoga: 0, hike: 0, total: 166 },
};

// Derived helpers
export function getCardioSessions(): GarminSession[] {
  return GARMIN_SESSIONS.filter(s => s.type === "CARDIO" || s.type === "STAIR STEPPER");
}

export function getHikeSessions(): GarminSession[] {
  return GARMIN_SESSIONS.filter(s => s.type === "HIKE");
}

export function getYogaSessions(): GarminSession[] {
  return GARMIN_SESSIONS.filter(s => s.type === "YOGA");
}

export function getSessionsByType(): { cardio: number; strength: number; yoga: number; hike: number; stairStepper: number } {
  return {
    cardio: GARMIN_SESSIONS.filter(s => s.type === "CARDIO").length,
    strength: GARMIN_SESSIONS.filter(s => s.type === "STRENGTH").length,
    yoga: GARMIN_SESSIONS.filter(s => s.type === "YOGA").length,
    hike: GARMIN_SESSIONS.filter(s => s.type === "HIKE").length,
    stairStepper: GARMIN_SESSIONS.filter(s => s.type === "STAIR STEPPER").length,
  };
}
