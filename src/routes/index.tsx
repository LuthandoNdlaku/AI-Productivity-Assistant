import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Flame,
  MessageSquareText,
  NotebookPen,
  Search,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiDisclaimer } from "@/components/disclaimer";
import { DEFAULT_STATS, type Stats } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · StudySphere AI" },
      {
        name: "description",
        content:
          "Your AI study success hub. Generate resources, plan smarter, understand faster, and excel in your Grade 12 exams.",
      },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    title: "AI Study Material Generator",
    description: "Notes, flashcards, practice questions and more — tailored to you.",
    icon: BookOpen,
    href: "/materials",
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Smart Notes Summarizer",
    description: "Turn class notes into focused revision packs in seconds.",
    icon: NotebookPen,
    href: "/summarizer",
    tone: "bg-accent/15 text-accent-foreground",
  },
  {
    title: "AI Study Planner",
    description: "Prioritized schedules built around your exams and energy.",
    icon: CalendarClock,
    href: "/planner",
    tone: "bg-warning/15 text-warning-foreground",
  },
  {
    title: "Research Assistant",
    description: "Simplify topics, deepen understanding, ace the question.",
    icon: Search,
    href: "/research",
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "AI Tutor Chat",
    description: "Your always-on academic mentor and exam coach.",
    icon: MessageSquareText,
    href: "/tutor",
    tone: "bg-accent/15 text-accent-foreground",
  },
  {
    title: "Progress Tracker",
    description: "See streaks, study hours and where to focus next.",
    icon: TrendingUp,
    href: "/progress",
    tone: "bg-warning/15 text-warning-foreground",
  },
] as const;

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
  hint?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className="size-5 text-primary" />
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("studysphere.stats");
      if (raw) setStats(JSON.parse(raw) as Stats);
    } catch {
      /* ignore */
    }
  }, []);

  const hours = (stats.studyMinutes / 60).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-10 text-primary-foreground sm:px-10 sm:py-14"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5" /> Built by Luthando Ndlaku · For Grade 12 success
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/80">
            Welcome, Luthando Ndlaku
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your AI Study Success Hub
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/85">
            Generate study resources, plan smarter, understand faster, and excel in your Grade 12
            exams.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/materials">
                Start studying <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link to="/tutor">Ask the AI tutor</Link>
            </Button>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 right-20 size-56 rounded-full bg-accent/30 blur-3xl" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Study Hours Logged" value={hours} icon={Timer} hint="all-time" />
        <StatCard
          label="Notes Summarized"
          value={String(stats.notesSummarized)}
          icon={NotebookPen}
        />
        <StatCard
          label="Resources Generated"
          value={String(stats.resourcesGenerated)}
          icon={Sparkles}
        />
        <StatCard
          label="Tasks Completed"
          value={String(stats.tasksCompleted)}
          icon={CheckCircle2}
          hint={`${stats.streakDays}-day streak`}
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Quick access</h2>
            <p className="text-sm text-muted-foreground">Jump straight into your study toolkit.</p>
          </div>
          <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Flame className="size-4 text-warning" />
            {stats.streakDays > 0 ? `${stats.streakDays}-day streak` : "Start your streak today"}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.href} to={tool.href} className="group">
              <Card className="h-full shadow-card transition-all group-hover:-translate-y-0.5 group-hover:shadow-elevated">
                <CardHeader>
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${tool.tone}`}
                  >
                    <tool.icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3 text-base">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <AiDisclaimer />
    </div>
  );
}
