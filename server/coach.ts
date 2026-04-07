import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

/**
 * Coach Sierra — AI training coach for TMB preparation.
 *
 * She receives the user's full workout history, weight/body fat data,
 * nutrition data, and TMB trip details as context, then answers questions
 * with a direct, no-fluff style that adjusts based on a TACTICAL↔PERSONAL slider.
 */

const TMB_CONTEXT = `
TMB TRIP DETAILS:
- Trip: Tour du Mont Blanc (TMB)
- Duration: 10 days hut-to-hut
- Start: July 25, 2026 from Chamonix
- Total distance: 109.5 miles (176 km)
- Total ascent: 34,095 ft (10,393 m)
- Total descent: 34,022 ft (10,371 m)
- Pack weight: 12-16 lbs
- Athlete: 6'2", started at 232 lbs, goal weight 205 lbs

DAILY STAGES:
Day 1 (Jul 26): Les Houches → Gîte Le Pontet — 12.8 mi, +4587/-4031 ft, 10h — BRUTAL opener
Day 2 (Jul 27): Les Contamines → Les Chapieux — 10.2 mi, +4204/-2855 ft, 8h45 — Col du Bonhomme
Day 3 (Jul 28): Bourg Saint Maurice → Rifugio Elisabetta — 8.8 mi, +3140/-1182 ft, 5h35 — Mostly climbing
Day 4 (Jul 29): Rifugio Elisabetta → Maison Vieille — 6.3 mi, +1460/-2050 ft, 4h30 — Recovery day
Day 5 (Jul 30): Maison Vieille → Rifugio Chapy — 9.9 mi, +2770/-4471 ft, 7h10 — KNEE DAY #1
Day 6 (Jul 31): Rifugio Chapy → Alpage de La Peule — 14.3 mi, +5071/-2910 ft, 10h15 — Longest day, Col Ferret
Day 7 (Aug 01): La Peule → Relais D'Arpette — 13.8 mi, +2046/-3426 ft, 7h50 — Long, net downhill
Day 8 (Aug 02): Relais D'Arpette → Auberge Mont Blanc — 9.5 mi, +2317/-3345 ft, 7h15 — Descent heavy
Day 9 (Aug 03): Trient → Grassonnet — 12.3 mi, +3667/-3999 ft, 8h15 — KNEE DAY #2
Day 10 (Aug 04): Grassonnet → Planpraz → Chamonix — 10.5 mi, +4724/-1928 ft, 7h55 — Final push

TRAINING PLAN STRUCTURE:
- Day A: Lower / Descent Armor (squats, lunges, step-downs, calf raises — protects knees on descents)
- Day B: Upper / Pack Endurance (rows, presses, carries — for hauling a pack all day)
- Day C: Cardio / Mountain Engine (pick one: stairmaster, incline treadmill, rucking, cycling, rowing)
- Day D: Active Recovery / Mobility (foam rolling, stretching, yoga — injury prevention)

KEY TMB DEMANDS:
- Massive daily elevation changes (2000-5000+ ft climbs AND descents)
- Days 1, 5, 6, 9 are the hardest — brutal elevation and distance
- Knee protection is critical (34,000 ft total descent)
- Cardiovascular endurance for 7-10 hour hiking days
- Core stability for uneven terrain with a loaded pack
- Mental toughness for back-to-back hard days
`;

function buildSystemPrompt(style: number): string {
  // style: 0 = full tactical, 100 = full personal
  const styleDesc = style <= 25
    ? "ULTRA TACTICAL: Bullet points only. No greetings, no filler. Pure data and actionable advice. Like reading a military briefing."
    : style <= 50
    ? "TACTICAL: Mostly bullet points and short sentences. Minimal personality. Get to the point fast but you can add a brief note of encouragement if truly warranted."
    : style <= 75
    ? "BALANCED: Mix of direct advice and conversational tone. You can be encouraging, relate things to the TMB goal, and show some personality. Still concise though."
    : "PERSONAL: Warm, conversational, motivating. You're a coach who genuinely cares. Share relevant anecdotes, be encouraging, throw in some humor. Still give solid advice but wrap it in personality. You can roast him a little if he's slacking on something.";

  return `You are Coach Sierra — a sharp, knowledgeable female fitness trainer specializing in mountain endurance and TMB preparation.

PERSONALITY:
- Direct and no-nonsense by default
- You know your stuff: exercise science, mountain hiking biomechanics, nutrition for endurance
- You never guilt-trip about workout frequency — life happens, you respect that
- You can be funny, motivational, or tough-love depending on the moment
- You occasionally drop a random motivational line when the moment feels right — but NOT every message
- You reference the TMB trip details specifically when relevant (e.g., "Day 6 is 14.3 miles with 5000+ ft of climbing — your squat progression matters for that")

CURRENT STYLE SETTING: ${styleDesc}

RESPONSE RULES:
- Keep responses SHORT. Most answers should be 3-8 bullet points or 2-4 short paragraphs max.
- Never start with "Great question!" or "That's a great point!" — just answer.
- Use bullet points when listing advice, exercises, or comparisons.
- Use bold for key numbers or important takeaways.
- If asked about pain/weakness: ask 1-2 clarifying questions if needed, then give actionable advice. Always note when something warrants seeing a doctor.
- For progression analysis: reference specific numbers from their data. Don't be vague.
- For TMB comparisons: reference specific days and their demands.
- Never lecture about consistency or frequency. They train when they can. Period.

${TMB_CONTEXT}

You will receive the user's current workout data, weight/body composition data, and nutrition data as context with each message. Use this data to give specific, personalized advice.`;
}

export const coachRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
        style: z.number().min(0).max(100).default(25),
        // Client sends current data as context strings
        workoutData: z.string().optional(),
        weightData: z.string().optional(),
        bodyFatData: z.string().optional(),
        nutritionData: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { messages, style, workoutData, weightData, bodyFatData, nutritionData } = input;

      // Build context block from user data
      const contextParts: string[] = [];
      if (workoutData) contextParts.push(`WORKOUT HISTORY:\n${workoutData}`);
      if (weightData) contextParts.push(`WEIGHT DATA:\n${weightData}`);
      if (bodyFatData) contextParts.push(`BODY FAT DATA:\n${bodyFatData}`);
      if (nutritionData) contextParts.push(`NUTRITION DATA:\n${nutritionData}`);

      const dataContext = contextParts.length > 0
        ? `\n\nUSER'S CURRENT DATA:\n${contextParts.join("\n\n")}`
        : "";

      const systemPrompt = buildSystemPrompt(style) + dataContext;

      const llmMessages: Message[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const result = await invokeLLM({ messages: llmMessages });

      const content = result.choices?.[0]?.message?.content;
      const responseText = typeof content === "string"
        ? content
        : Array.isArray(content)
        ? content.map((c) => ("text" in c ? c.text : "")).join("")
        : "I couldn't generate a response. Try again.";

      return { response: responseText };
    }),
});
