import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · StudySphere AI" },
      { name: "description", content: "Manage your StudySphere AI data and preferences." },
    ],
  }),
  component: SettingsPage,
});

function clearAll() {
  if (typeof window === "undefined") return;
  ["studysphere.stats", "studysphere.tasks", "studysphere.tutor.messages"].forEach((k) =>
    window.localStorage.removeItem(k),
  );
  toast.success("All local study data cleared.");
}

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Privacy, responsible AI, and local data controls."
        icon={<SettingsIcon className="size-5" />}
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Privacy</CardTitle>
          <CardDescription>How your information is handled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            StudySphere AI stores your tasks, stats and chat history{" "}
            <span className="font-medium text-foreground">only in this browser</span>. Nothing is
            sent to a server unless you submit it to an AI tool.
          </p>
          <p>
            When you use an AI feature, your input is sent to the Lovable AI Gateway to generate a
            response. Avoid sharing personal information.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" /> Responsible AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            AI-generated content is designed to support learning and revision. Always verify
            important academic information with official textbooks, teachers, and examination
            guidelines.
          </p>
          <p>
            <strong className="text-foreground">Academic integrity:</strong> use StudySphere as a
            study aid — not as a substitute for your own thinking or in ways that violate your
            school's rules.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Local data</CardTitle>
          <CardDescription>Reset your StudySphere progress and chat history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={clearAll}>
            <Trash2 className="size-4" /> Clear all local data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
