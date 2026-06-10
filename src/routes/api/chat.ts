import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

const SYSTEM = `You are StudySphere AI — a warm, encouraging Grade 12 academic mentor. You act as study coach, tutor, academic advisor, and exam-prep assistant. Be concise, accurate, and exam-focused. Use markdown formatting (headings, bullets, code blocks for formulas). When asked to plan or summarize, structure responses with clear sections. Always end longer answers with one motivating line. Remind learners to verify critical facts with their teachers when appropriate.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatRequestBody;
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");
          const result = streamText({
            model,
            system: SYSTEM,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });
          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode ?? 500;
          const msg =
            status === 429
              ? "Rate limit reached. Please try again shortly."
              : status === 402
                ? "AI credits exhausted. Add credits in your Lovable workspace."
                : err instanceof Error
                  ? err.message
                  : "Chat failed";
          return new Response(msg, { status });
        }
      },
    },
  },
});
