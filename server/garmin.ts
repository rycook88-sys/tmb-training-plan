// ============================================================
// Garmin FIT File Upload & Parsing
// Accepts .fit or .zip (containing .fit) files via tRPC mutation
// Parses sessions and returns GarminSession-compatible data
// Stores parsed sessions in the database for cross-device access
// ============================================================
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import FitParser from "fit-file-parser";
import AdmZip from "adm-zip";
import { eq, and } from "drizzle-orm";
import { nutritionBackups } from "../drizzle/schema";
import { getDb } from "./db";

// HR zone boundaries (from user's Garmin: Max 196, Rest 56, HRR 140)
const ZONES = {
  z1_low: 126,
  z1_high: 140,
  z2_high: 154,
  z3_high: 168,
  z4_high: 182,
  z5_high: 196,
};

interface ParsedSession {
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

function mapSportType(sport: string, subSport: string, profileName: string): ParsedSession["type"] {
  const s = (sport || "").toLowerCase();
  const sub = (subSport || "").toLowerCase();
  const prof = (profileName || "").toLowerCase();

  if (s === "hiking" || prof.includes("hike")) return "HIKE";
  if (s === "yoga" || prof.includes("yoga")) return "YOGA";
  if (s === "training" || s === "strength_training" || prof.includes("strength")) return "STRENGTH";
  if (prof.includes("stair") || prof.includes("stepper")) return "STAIR STEPPER";
  // Default cardio for running, cycling, generic, etc.
  return "CARDIO";
}

function computeHRZones(records: any[], totalTime: number): { below_z1: number; z1_pct: number; z2_pct: number; z3_pct: number; z4_pct: number; z5_pct: number } {
  if (!records || records.length < 2 || totalTime <= 0) {
    return { below_z1: 100, z1_pct: 0, z2_pct: 0, z3_pct: 0, z4_pct: 0, z5_pct: 0 };
  }

  let below = 0, z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0;

  for (let i = 1; i < records.length; i++) {
    const hr = records[i].heart_rate;
    if (!hr) continue;
    const prev = records[i - 1].timestamp ? new Date(records[i - 1].timestamp).getTime() : 0;
    const curr = records[i].timestamp ? new Date(records[i].timestamp).getTime() : 0;
    const dt = (curr - prev) / 1000; // seconds
    if (dt <= 0 || dt > 60) continue; // skip gaps

    if (hr < ZONES.z1_low) below += dt;
    else if (hr < ZONES.z1_high) z1 += dt;
    else if (hr < ZONES.z2_high) z2 += dt;
    else if (hr < ZONES.z3_high) z3 += dt;
    else if (hr < ZONES.z4_high) z4 += dt;
    else z5 += dt;
  }

  const sum = below + z1 + z2 + z3 + z4 + z5;
  if (sum === 0) return { below_z1: 100, z1_pct: 0, z2_pct: 0, z3_pct: 0, z4_pct: 0, z5_pct: 0 };

  return {
    below_z1: Math.round((below / sum) * 1000) / 10,
    z1_pct: Math.round((z1 / sum) * 1000) / 10,
    z2_pct: Math.round((z2 / sum) * 1000) / 10,
    z3_pct: Math.round((z3 / sum) * 1000) / 10,
    z4_pct: Math.round((z4 / sum) * 1000) / 10,
    z5_pct: Math.round((z5 / sum) * 1000) / 10,
  };
}

function computeDrift(records: any[]): number {
  if (!records || records.length < 20) return 0;
  const hrRecords = records.filter((r: any) => r.heart_rate && r.heart_rate > 0);
  if (hrRecords.length < 20) return 0;

  const mid = Math.floor(hrRecords.length / 2);
  const firstHalf = hrRecords.slice(0, mid);
  const secondHalf = hrRecords.slice(mid);

  const avgFirst = firstHalf.reduce((s: number, r: any) => s + r.heart_rate, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s: number, r: any) => s + r.heart_rate, 0) / secondHalf.length;

  return Math.round(((avgSecond - avgFirst) / avgFirst) * 1000) / 10;
}

function parseFitBuffer(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({ force: true, speedUnit: "mph", lengthUnit: "mi", elapsedRecordField: true });
    parser.parse(buffer as any, (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function extractSessionsFromFit(buffer: Buffer, fileId: string): Promise<ParsedSession[]> {
  const data = await parseFitBuffer(buffer);
  const sessions: ParsedSession[] = [];

  if (!data.sessions || data.sessions.length === 0) return sessions;

  for (const s of data.sessions) {
    const durationSec = s.total_elapsed_time || s.total_timer_time || 0;
    const durationMin = Math.round(durationSec / 60);
    const date = s.start_time ? new Date(s.start_time).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

    const type = mapSportType(s.sport || "", s.sub_sport || "", s.sport_profile_name || "");

    // Elevation: parser returns in miles when lengthUnit='mi', convert to feet
    const elevGain = Math.round((s.total_ascent || 0) * 5280);
    const elevLoss = Math.round((s.total_descent || 0) * 5280);

    const zones = computeHRZones(data.records || [], durationSec);
    const drift = computeDrift(data.records || []);

    sessions.push({
      id: fileId || String(Date.now()),
      date,
      type,
      duration_min: durationMin,
      avg_hr: Math.round((s.avg_heart_rate || 0) * 10) / 10,
      max_hr: s.max_heart_rate || 0,
      calories: s.total_calories || 0,
      distance_mi: Math.round((s.total_distance || 0) * 100) / 100,
      elevation_gain: elevGain,
      elevation_loss: elevLoss,
      drift,
      ...zones,
    });
  }

  return sessions;
}

const GARMIN_DATA_TYPE = "garmin-uploaded-sessions";

export const garminRouter = router({
  // Upload and parse a FIT file (sent as base64)
  upload: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const buffer = Buffer.from(input.fileData, "base64");
      let fitBuffer: Buffer;

      // Check if it's a ZIP file (PK header)
      if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        const fitEntry = entries.find(e => e.entryName.toLowerCase().endsWith(".fit"));
        if (!fitEntry) throw new Error("No .fit file found in ZIP archive");
        fitBuffer = fitEntry.getData();
      } else {
        fitBuffer = buffer;
      }

      // Extract file ID from filename (e.g., "22120284505_ACTIVITY.fit" -> "22120284505")
      const fileId = input.fileName.replace(/[^0-9]/g, "").slice(0, 11) || String(Date.now());

      const newSessions = await extractSessionsFromFit(fitBuffer, fileId);
      if (newSessions.length === 0) {
        throw new Error("No activity sessions found in FIT file");
      }

      // Load existing uploaded sessions from DB
      const existing = await db
        .select()
        .from(nutritionBackups)
        .where(and(
          eq(nutritionBackups.userId, ctx.user!.id),
          eq(nutritionBackups.dataType, GARMIN_DATA_TYPE),
        ));

      let allSessions: ParsedSession[] = [];
      if (existing.length > 0 && existing[0].jsonData) {
        try {
          allSessions = JSON.parse(existing[0].jsonData);
        } catch { /* ignore */ }
      }

      // Merge: add new sessions, skip duplicates by ID
      const existingIds = new Set(allSessions.map(s => s.id));
      for (const ns of newSessions) {
        if (!existingIds.has(ns.id)) {
          allSessions.push(ns);
        }
      }

      // Sort by date
      allSessions.sort((a, b) => a.date.localeCompare(b.date));

      // Save to DB
      const jsonData = JSON.stringify(allSessions);
      if (existing.length > 0) {
        await db
          .update(nutritionBackups)
          .set({ jsonData, updatedAt: new Date() })
          .where(and(
            eq(nutritionBackups.userId, ctx.user!.id),
            eq(nutritionBackups.dataType, GARMIN_DATA_TYPE),
          ));
      } else {
        await db.insert(nutritionBackups).values({
          userId: ctx.user!.id,
          dataType: GARMIN_DATA_TYPE,
          jsonData,
        });
      }

      return {
        newSessions,
        totalSessions: allSessions.length,
      };
    }),

  // Get all uploaded Garmin sessions
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(nutritionBackups)
      .where(and(
        eq(nutritionBackups.userId, ctx.user!.id),
        eq(nutritionBackups.dataType, GARMIN_DATA_TYPE),
      ));

    if (rows.length === 0) return [];

    try {
      return JSON.parse(rows[0].jsonData || "[]") as ParsedSession[];
    } catch {
      return [];
    }
  }),
});
