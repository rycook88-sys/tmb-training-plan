import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb to return a fake database
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: () => ({
      from: () => ({
        where: mockWhere,
      }),
    }),
    insert: () => ({
      values: mockValues,
    }),
    update: () => ({
      set: () => ({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock fit-file-parser
vi.mock("fit-file-parser", () => {
  return {
    default: class FitParser {
      constructor(_opts: any) {}
      parse(buffer: any, cb: (err: any, data: any) => void) {
        // Return a minimal valid FIT parse result
        cb(null, {
          sessions: [
            {
              start_time: "2026-03-10T08:00:00Z",
              sport: "hiking",
              sub_sport: "",
              sport_profile_name: "Hike",
              total_elapsed_time: 7200, // 2 hours
              total_timer_time: 7200,
              avg_heart_rate: 135,
              max_heart_rate: 165,
              total_calories: 850,
              total_distance: 5.2, // miles
              total_ascent: 0.214, // miles -> 1130 ft
              total_descent: 0.270, // miles -> 1426 ft
            },
          ],
          records: [
            { timestamp: "2026-03-10T08:00:00Z", heart_rate: 120 },
            { timestamp: "2026-03-10T08:00:10Z", heart_rate: 125 },
            { timestamp: "2026-03-10T08:00:20Z", heart_rate: 130 },
            { timestamp: "2026-03-10T08:00:30Z", heart_rate: 135 },
            { timestamp: "2026-03-10T08:00:40Z", heart_rate: 140 },
            { timestamp: "2026-03-10T08:00:50Z", heart_rate: 145 },
            { timestamp: "2026-03-10T08:01:00Z", heart_rate: 150 },
            { timestamp: "2026-03-10T08:01:10Z", heart_rate: 155 },
            { timestamp: "2026-03-10T08:01:20Z", heart_rate: 160 },
            { timestamp: "2026-03-10T08:01:30Z", heart_rate: 165 },
          ],
        });
      }
    },
  };
});

// Mock adm-zip
vi.mock("adm-zip", () => {
  return {
    default: class AdmZip {
      constructor(_buffer: Buffer) {}
      getEntries() {
        return [
          {
            entryName: "activity.fit",
            getData: () => Buffer.from("fake-fit-data"),
          },
        ];
      }
    },
  };
});

import { appRouter } from "./routers";

function createAuthContext() {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus" as const,
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

describe("Garmin Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing sessions in DB
    mockWhere.mockResolvedValue([]);
    mockValues.mockResolvedValue(undefined);
  });

  describe("upload", () => {
    it("should parse a FIT file and return new sessions", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a fake base64 FIT file (not a ZIP — no PK header)
      const fakeData = Buffer.from("fake-fit-file-content");
      const base64 = fakeData.toString("base64");

      const result = await caller.garmin.upload({
        fileName: "22120284505_ACTIVITY.fit",
        fileData: base64,
      });

      expect(result.newSessions).toHaveLength(1);
      expect(result.newSessions[0].type).toBe("HIKE");
      expect(result.newSessions[0].date).toBe("2026-03-10");
      expect(result.newSessions[0].duration_min).toBe(120);
      expect(result.newSessions[0].avg_hr).toBe(135);
      expect(result.newSessions[0].max_hr).toBe(165);
      expect(result.newSessions[0].calories).toBe(850);
      expect(result.totalSessions).toBe(1);
    });

    it("should parse a ZIP file containing a FIT file", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a buffer with PK header (ZIP magic bytes)
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const fakeZip = Buffer.concat([zipHeader, Buffer.from("rest-of-zip")]);
      const base64 = fakeZip.toString("base64");

      const result = await caller.garmin.upload({
        fileName: "export.zip",
        fileData: base64,
      });

      expect(result.newSessions).toHaveLength(1);
      expect(result.newSessions[0].type).toBe("HIKE");
      expect(result.totalSessions).toBe(1);
    });

    it("should skip duplicate sessions when uploading", async () => {
      // Simulate existing sessions in DB
      mockWhere.mockResolvedValue([
        {
          jsonData: JSON.stringify([
            { id: "22120284505", date: "2026-03-10", type: "HIKE" },
          ]),
        },
      ]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const fakeData = Buffer.from("fake-fit-file-content");
      const base64 = fakeData.toString("base64");

      const result = await caller.garmin.upload({
        fileName: "22120284505_ACTIVITY.fit",
        fileData: base64,
      });

      // The session has the same ID so it should be skipped
      expect(result.newSessions).toHaveLength(1); // parser returns 1 new
      expect(result.totalSessions).toBe(1); // but total stays 1 (deduped)
    });

    it("should extract file ID from filename", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const fakeData = Buffer.from("fake-fit-file-content");
      const base64 = fakeData.toString("base64");

      const result = await caller.garmin.upload({
        fileName: "22120284505_ACTIVITY.fit",
        fileData: base64,
      });

      expect(result.newSessions[0].id).toBe("22120284505");
    });
  });

  describe("getSessions", () => {
    it("should return empty array when no sessions exist", async () => {
      mockWhere.mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.garmin.getSessions();
      expect(result).toEqual([]);
    });

    it("should return parsed sessions from DB", async () => {
      const sessions = [
        { id: "123", date: "2026-03-10", type: "HIKE", duration_min: 120 },
      ];
      mockWhere.mockResolvedValue([{ jsonData: JSON.stringify(sessions) }]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.garmin.getSessions();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("123");
      expect(result[0].type).toBe("HIKE");
    });

    it("should return empty array on invalid JSON", async () => {
      mockWhere.mockResolvedValue([{ jsonData: "invalid-json{{{" }]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.garmin.getSessions();
      expect(result).toEqual([]);
    });
  });
});
