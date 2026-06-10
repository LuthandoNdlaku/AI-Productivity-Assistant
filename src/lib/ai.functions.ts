import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(MODEL);
}

async function run(system: string, prompt: string) {
  try {
    const { text } = await generateText({
      model: getModel(),
      system,
      prompt,
    });
    return { text };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
    if (status === 402)
      throw new Error("AI credits exhausted. Please add credits in your Lovable workspace.");
    throw new Error(message);
  }
}

export const generateStudyMaterial = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      subject: z.string().min(1).max(120),
      topic: z.string().min(1).max(200),
      gradeLevel: z.string().min(1).max(40),
      objective: z.string().min(1).max(400),
      materialType: z.enum([
        "study-notes",
        "exam-summary",
        "revision-guide",
        "flashcards",
        "practice-questions",
        "essay-outline",
      ]),
      learningStyle: z.enum(["visual", "reading", "practice", "mixed"]),
      difficulty: z.enum(["basic", "intermediate", "advanced"]),
    }),
  )
  .handler(async ({ data }) => {
    const labels: Record<string, string> = {
      "study-notes": "structured study notes",
      "exam-summary": "exam summary",
      "revision-guide": "revision guide",
      flashcards: "set of 10 flashcards (Q: ... / A: ...)",
      "practice-questions": "set of 8 practice questions with model answers",
      "essay-outline": "detailed essay outline",
    };
    const system = `You are StudySphere AI, a Grade 12 academic tutor. Produce clear, accurate, exam-aligned study content. Use markdown with headings, bullet points, and tables where useful.`;
    const prompt = `Create a ${labels[data.materialType]} on:
Subject: ${data.subject}
Topic: ${data.topic}
Grade level: ${data.gradeLevel}
Learning objective: ${data.objective}
Learner style: ${data.learningStyle}
Difficulty: ${data.difficulty}

Tailor language and examples to a Grade 12 learner. Include a short "Exam tips" section at the end.`;
    return run(system, prompt);
  });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      content: z.string().min(20).max(50000),
      subject: z.string().max(120).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const system = `You are a Grade 12 study coach. Summarize learner notes into a focused revision pack. Always output markdown with these exact sections in order:
## Summary
## Key Concepts
## Important Terms
## Formulas & Definitions
## Exam Focus Areas
## Recommended Revision Plan`;
    const prompt = `${data.subject ? `Subject: ${data.subject}\n\n` : ""}Notes:\n${data.content}`;
    return run(system, prompt);
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      subjects: z.string().min(1).max(500),
      hoursPerDay: z.number().min(1).max(16),
      examDates: z.string().max(500).optional(),
      deadlines: z.string().max(500).optional(),
      commitments: z.string().max(500).optional(),
      horizon: z.enum(["daily", "weekly", "exam-prep"]),
    }),
  )
  .handler(async ({ data }) => {
    const system = `You are an academic planning AI for Grade 12 learners. Build prioritized, realistic study schedules using urgency, importance, and subject difficulty. Include focused study blocks (Pomodoro 25/5 or 50/10), revision intervals, and breaks. Output markdown with a clear table per day.`;
    const prompt = `Plan type: ${data.horizon}
Subjects: ${data.subjects}
Available hours/day: ${data.hoursPerDay}
Exam dates: ${data.examDates || "n/a"}
Assignment deadlines: ${data.deadlines || "n/a"}
Personal commitments: ${data.commitments || "n/a"}

Produce a complete schedule with study blocks (time, subject, activity, goal), recommended breaks, and a short "Productivity tips" section.`;
    return run(system, prompt);
  });

export const researchAssistant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      query: z.string().min(3).max(8000),
      mode: z.enum(["eli16", "quick-revision", "deep-understanding"]),
    }),
  )
  .handler(async ({ data }) => {
    const modeInstr: Record<string, string> = {
      eli16: "Explain like the learner is 16. Use everyday analogies and short sentences.",
      "quick-revision":
        "Give a compact revision sheet: 5-7 bullet key points, then a one-line memory aid.",
      "deep-understanding":
        "Provide a thorough explanation with mechanisms, derivations, and edge cases.",
    };
    const system = `You are a Grade 12 research and learning assistant. ${modeInstr[data.mode]} Output markdown with sections:
## Summary
## Key Takeaways
## Examples
## Exam Tips
## Further Study`;
    return run(system, data.query);
  });
