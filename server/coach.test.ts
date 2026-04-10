import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storagePut
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "coach-photos/test123.jpg",
    url: "https://cdn.example.com/coach-photos/test123.jpg",
  }),
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: () => "test123",
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test",
    created: Date.now(),
    model: "test-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Nice photo! Your form looks solid.",
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

import { appRouter } from "./routers";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

function createTestContext() {
  return {
    user: null,
    req: {} as any,
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

describe("Coach Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadImage", () => {
    it("should upload a base64 image to S3 and return the URL", async () => {
      const caller = appRouter.createCaller(createTestContext());
      const fakeBase64 = Buffer.from("fake-image-data").toString("base64");

      const result = await caller.coach.uploadImage({
        imageBase64: fakeBase64,
        mimeType: "image/jpeg",
      });

      expect(result.url).toBe("https://cdn.example.com/coach-photos/test123.jpg");
      expect(storagePut).toHaveBeenCalledWith(
        "coach-photos/test123.jpg",
        expect.any(Buffer),
        "image/jpeg"
      );
    });

    it("should use .png extension for PNG images", async () => {
      const caller = appRouter.createCaller(createTestContext());
      const fakeBase64 = Buffer.from("fake-png-data").toString("base64");

      await caller.coach.uploadImage({
        imageBase64: fakeBase64,
        mimeType: "image/png",
      });

      expect(storagePut).toHaveBeenCalledWith(
        "coach-photos/test123.png",
        expect.any(Buffer),
        "image/png"
      );
    });

    it("should use .webp extension for WebP images", async () => {
      const caller = appRouter.createCaller(createTestContext());
      const fakeBase64 = Buffer.from("fake-webp-data").toString("base64");

      await caller.coach.uploadImage({
        imageBase64: fakeBase64,
        mimeType: "image/webp",
      });

      expect(storagePut).toHaveBeenCalledWith(
        "coach-photos/test123.webp",
        expect.any(Buffer),
        "image/webp"
      );
    });
  });

  describe("chat", () => {
    it("should send text-only messages to LLM", async () => {
      const caller = appRouter.createCaller(createTestContext());

      const result = await caller.coach.chat({
        messages: [{ role: "user", content: "How's my progress?" }],
        style: 25,
      });

      expect(result.response).toBe("Nice photo! Your form looks solid.");
      expect(invokeLLM).toHaveBeenCalledWith({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user", content: "How's my progress?" }),
        ]),
      });
    });

    it("should send multimodal messages when imageUrls are provided", async () => {
      const caller = appRouter.createCaller(createTestContext());

      const result = await caller.coach.chat({
        messages: [
          {
            role: "user",
            content: "Check my form",
            imageUrls: ["https://cdn.example.com/photo1.jpg"],
          },
        ],
        style: 50,
      });

      expect(result.response).toBe("Nice photo! Your form looks solid.");

      // Verify the LLM was called with multimodal content
      const llmCall = (invokeLLM as any).mock.calls[0][0];
      const userMessage = llmCall.messages[llmCall.messages.length - 1];
      expect(Array.isArray(userMessage.content)).toBe(true);
      expect(userMessage.content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "text", text: "Check my form" }),
          expect.objectContaining({
            type: "image_url",
            image_url: expect.objectContaining({
              url: "https://cdn.example.com/photo1.jpg",
              detail: "high",
            }),
          }),
        ])
      );
    });

    it("should use '(photo)' as text when content is empty but images exist", async () => {
      const caller = appRouter.createCaller(createTestContext());

      await caller.coach.chat({
        messages: [
          {
            role: "user",
            content: "",
            imageUrls: ["https://cdn.example.com/photo1.jpg"],
          },
        ],
        style: 25,
      });

      const llmCall = (invokeLLM as any).mock.calls[0][0];
      const userMessage = llmCall.messages[llmCall.messages.length - 1];
      expect(userMessage.content[0]).toEqual({ type: "text", text: "(photo)" });
    });

    it("should include garmin data in system prompt when provided", async () => {
      const caller = appRouter.createCaller(createTestContext());

      await caller.coach.chat({
        messages: [{ role: "user", content: "Analyze my cardio" }],
        style: 25,
        garminData: "VO2max: 48, Weekly miles: 22",
      });

      const llmCall = (invokeLLM as any).mock.calls[0][0];
      const systemMsg = llmCall.messages[0];
      expect(systemMsg.content).toContain("GARMIN WATCH DATA");
      expect(systemMsg.content).toContain("VO2max: 48");
    });
  });
});
