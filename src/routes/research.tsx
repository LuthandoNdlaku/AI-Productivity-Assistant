import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { OutputActions } from "@/components/output-actions";
import { AiDisclaimer } from "@/components/disclaimer";
import { researchAssistant } from "@/lib/ai.functions";
import { bumpStat } from "@/lib/storage";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant · StudySphere AI" },
      {
        name: "description",
        content: "Ask anything academic. Get exam-focused explanations and key takeaways.",
      },
    ],
  }),
  component: ResearchPage,
});

type Mode = "eli16" | "quick-revision" | "deep-understanding";

function ResearchPage() {
  const research = useServerFn(researchAssistant);
  const [mode, setMode] = useState<Mode>("eli16");
  const [query, setQuery] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3) {
      toast.error("Please enter a topic or question.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const res = await research({ data: { query, mode } });
      setOutput(res.text);
      bumpStat({ resourcesGenerated: 1 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="AI Research & Learning Assistant"
        subtitle="Drop a topic, article excerpt, or question. Pick the mode that fits your moment."
        icon={<Search className="size-5" />}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Ask anything academic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="eli16">Explain Like I'm 16</TabsTrigger>
              <TabsTrigger value="quick-revision">Quick Revision</TabsTrigger>
              <TabsTrigger value="deep-understanding">Deep Understanding</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={onSubmit} className="space-y-3">
            <Textarea
              rows={6}
              placeholder="e.g. Explain Newton's third law with sport examples, or paste an article excerpt to break down…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Thinking…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Get explanation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {(loading || output) && (
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Answer</CardTitle>
            {output ? <OutputActions text={output} filename="research.md" /> : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <Markdown>{output}</Markdown>
            )}
          </CardContent>
        </Card>
      )}

      <AiDisclaimer />
    </div>
  );
}
