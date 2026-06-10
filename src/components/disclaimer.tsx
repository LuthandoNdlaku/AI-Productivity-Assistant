import { ShieldCheck } from "lucide-react";

export function AiDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border bg-muted/40 text-muted-foreground ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      }`}
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        AI-generated content is designed to support learning and revision. Verify important
        academic information with official textbooks, teachers, and examination guidelines.
      </p>
    </div>
  );
}
