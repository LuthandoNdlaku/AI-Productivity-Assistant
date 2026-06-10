import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, NotebookPen, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { OutputActions } from "@/components/output-actions";
import { AiDisclaimer } from "@/components/disclaimer";
import { summarizeNotes } from "@/lib/ai.functions";
import { bumpStat } from "@/lib/storage";

export const Route = createFileRoute("/summarizer")({
  head: () => ({
    meta: [
      { title: "Notes Summarizer · StudySphere AI" },
      {
        name: "description",
        content: "Turn class notes and study material into focused revision packs.",
      },
    ],
  }),
  component: SummarizerPage,
});

function SummarizerPage() {
  const summarize = useServerFn(summarizeNotes);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      toast.error("Please upload a file under 1.5MB (text-based files work best).");
      return;
    }
    try {
      const text = await file.text();
      setContent(text.slice(0, 48000));
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("Could not read that file. Try pasting the text instead.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < 20) {
      toast.error("Please paste at least a paragraph of notes.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const res = await summarize({ data: { content, subject: subject || undefined } });
      setOutput(res.text);
      bumpStat({ notesSummarized: 1 });
      toast.success("Summary ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Summarize failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Smart Notes Summarizer"
        subtitle="Paste notes, upload a text file, and get a clean revision pack."
        icon={<NotebookPen className="size-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Your notes</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label>Subject (optional)</Label>
                <Input
                  placeholder="e.g. History — Cold War"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Paste notes</Label>
                <Textarea
                  rows={12}
                  placeholder="Paste class notes, textbook excerpts or study material…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{content.length} characters</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.csv,.json"
                  className="hidden"
                  onChange={onFile}
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-4" /> Upload .txt/.md
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Summarizing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" /> Summarize
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Revision pack</CardTitle>
            {output ? <OutputActions text={output} filename="revision-pack.md" /> : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : output ? (
              <Markdown>{output}</Markdown>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Your structured summary will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AiDisclaimer />
    </div>
  );
}
