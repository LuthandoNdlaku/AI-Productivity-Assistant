import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, Target, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { DEFAULT_STATS, type Stats, type Task } from "@/lib/storage";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress · StudySphere AI" },
      { name: "description", content: "See your study streaks, hours, and subject focus." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    try {
      const s = window.localStorage.getItem("studysphere.stats");
      if (s) setStats(JSON.parse(s) as Stats);
      const t = window.localStorage.getItem("studysphere.tasks");
      if (t) setTasks(JSON.parse(t) as Task[]);
    } catch {
      /* ignore */
    }
  }, []);

  const weeklyTotal = stats.weekly.reduce((a, b) => a + b.minutes, 0);
  const weeklyGoalMinutes = 600;
  const weeklyPct = Math.min(100, Math.round((weeklyTotal / weeklyGoalMinutes) * 100));
  const upcoming = tasks
    .filter((t) => !t.done && t.due)
    .sort((a, b) => (a.due! < b.due! ? -1 : 1))
    .slice(0, 5);
  const subjectTotals = Object.entries(stats.subjectMinutes || {});

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Progress Tracker"
        subtitle="Your learning at a glance — streaks, hours, and focus areas."
        icon={<TrendingUp className="size-5" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="size-4 text-warning" /> Study streak
            </div>
            <p className="mt-2 text-3xl font-semibold">{stats.streakDays} days</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="size-4 text-primary" /> Weekly goal
            </div>
            <p className="mt-2 text-3xl font-semibold">{weeklyPct}%</p>
            <Progress value={weeklyPct} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {(weeklyTotal / 60).toFixed(1)}h of {(weeklyGoalMinutes / 60).toFixed(0)}h target
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="size-4 text-accent" /> Tasks done
            </div>
            <p className="mt-2 text-3xl font-semibold">{stats.tasksCompleted}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tasks.filter((t) => !t.done).length} open in your planner
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">This week's study minutes</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Subjects studied</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectTotals.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Complete planner tasks to track subject focus.
              </p>
            ) : (
              <ul className="space-y-3">
                {subjectTotals.map(([s, m]) => (
                  <li key={s} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s}</span>
                    <span className="text-muted-foreground">{(m / 60).toFixed(1)}h</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No deadlines set — add tasks with due dates in your planner.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.subject}</p>
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">{t.due}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
