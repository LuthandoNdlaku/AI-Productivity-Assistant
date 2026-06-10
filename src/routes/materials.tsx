import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { AiDisclaimer } from "@/components/disclaimer";
import { Markdown } from "@/components/markdown";
import { OutputActions } from "@/components/output-actions";
import { generateStudyMaterial } from "@/lib/ai.functions";
import { bumpStat } from "@/lib/storage";

export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Study Materials · StudySphere AI" },
      {
        name: "description",
        content: "Generate notes, flashcards, practice questions and revision guides with AI.",
      },
    ],
  }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const generate = useServerFn(generateStudyMaterial);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  const [form, setForm] = useState({
    subject: "",
    topic: "",
    gradeLevel: "Grade 12",
    objective: "",
    materialType: "study-notes" as const,
    learningStyle: "mixed" as const,
    difficulty: "intermediate" as const,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject || !form.topic || !form.objective) {
      toast.error("Please fill subject, topic and learning objective");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const res = await generate({ data: form });
      setOutput(res.text);
      bumpStat({ resourcesGenerated: 1 });
      toast.success("Study material ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="AI Study Material Generator"
        subtitle="Create study notes, flashcards, practice questions and more, tailored to your style."
        icon={<BookOpen className="size-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Tell us what you're studying</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    placeholder="e.g. Biology"
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Grade level</Label>
                  <Input
                    value={form.gradeLevel}
                    onChange={(e) => update("gradeLevel", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Input
                  placeholder="e.g. Photosynthesis — light reactions"
                  value={form.topic}
                  onChange={(e) => update("topic", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Learning objective</Label>
                <Textarea
                  rows={3}
                  placeholder="What should you be able to do after studying?"
                  value={form.objective}
                  onChange={(e) => update("objective", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Material type</Label>
                <Select
                  value={form.materialType}
                  onValueChange={(v) => update("materialType", v as typeof form.materialType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study-notes">Study notes</SelectItem>
                    <SelectItem value="exam-summary">Exam summary</SelectItem>
                    <SelectItem value="revision-guide">Revision guide</SelectItem>
                    <SelectItem value="flashcards">Flashcards</SelectItem>
                    <SelectItem value="practice-questions">Practice questions</SelectItem>
                    <SelectItem value="essay-outline">Essay outline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Learning style</Label>
                  <Select
                    value={form.learningStyle}
                    onValueChange={(v) => update("learningStyle", v as typeof form.learningStyle)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual">Visual</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) => update("difficulty", v as typeof form.difficulty)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Generate material
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Your study material</CardTitle>
            {output ? <OutputActions text={output} filename="study-material.md" /> : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ) : output ? (
              <Markdown>{output}</Markdown>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Fill the form and your tailored material will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AiDisclaimer />
    </div>
  );
}
