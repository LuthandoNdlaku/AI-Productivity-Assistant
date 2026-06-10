import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, CheckCircle2, Circle, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { Markdown } from "@/components/markdown";
import { OutputActions } from "@/components/output-actions";
import { AiDisclaimer } from "@/components/disclaimer";
import { generateStudyPlan } from "@/lib/ai.functions";
import { bumpStat, useLocalStorage, type Task } from "@/lib/storage";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Study Planner · StudySphere AI" },
      { name: "description", content: "AI-built study plans with tasks and progress tracking." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const plan = useServerFn(generateStudyPlan);
  const tasks = useLocalStorage<Task[]>("studysphere.tasks", []);

  const [form, setForm] = useState({
    subjects: "",
    hoursPerDay: 3,
    examDates: "",
    deadlines: "",
    commitments: "",
    horizon: "weekly" as const,
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const [newTask, setNewTask] = useState({ title: "", subject: "", due: "" });

  async function onPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subjects) {
      toast.error("Please list at least one subject.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const res = await plan({ data: form });
      setOutput(res.text);
      bumpStat({ resourcesGenerated: 1 });
      toast.success("Study plan ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Plan failed");
    } finally {
      setLoading(false);
    }
  }

  function addTask() {
    if (!newTask.title.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      title: newTask.title.trim(),
      subject: newTask.subject.trim() || "General",
      due: newTask.due || undefined,
      done: false,
      createdAt: Date.now(),
    };
    tasks.setValue([t, ...tasks.value]);
    setNewTask({ title: "", subject: "", due: "" });
  }

  function toggle(id: string) {
    tasks.setValue(
      tasks.value.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, done: !t.done };
        if (next.done && !t.done) bumpStat({ tasksCompleted: 1, studyMinutes: 25 });
        return next;
      }),
    );
  }

  function remove(id: string) {
    tasks.setValue(tasks.value.filter((t) => t.id !== id));
  }

  const completed = tasks.value.filter((t) => t.done).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="AI Study Planner"
        subtitle="Generate prioritized schedules and track your study tasks."
        icon={<CalendarClock className="size-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Plan inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onPlan}>
              <div className="space-y-1.5">
                <Label>Subjects</Label>
                <Input
                  placeholder="Maths, Physical Sciences, English"
                  value={form.subjects}
                  onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hours / day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={16}
                    value={form.hoursPerDay}
                    onChange={(e) =>
                      setForm({ ...form, hoursPerDay: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Plan type</Label>
                  <Select
                    value={form.horizon}
                    onValueChange={(v) => setForm({ ...form, horizon: v as typeof form.horizon })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="exam-prep">Exam prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Exam dates</Label>
                <Textarea
                  rows={2}
                  placeholder="Maths 14 Nov, Physics 18 Nov…"
                  value={form.examDates}
                  onChange={(e) => setForm({ ...form, examDates: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assignment deadlines</Label>
                <Textarea
                  rows={2}
                  value={form.deadlines}
                  onChange={(e) => setForm({ ...form, deadlines: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Personal commitments</Label>
                <Textarea
                  rows={2}
                  placeholder="Soccer Tue 5pm, family dinner Sun…"
                  value={form.commitments}
                  onChange={(e) => setForm({ ...form, commitments: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Building plan…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Generate plan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Your AI-generated schedule</CardTitle>
              {output ? <OutputActions text={output} filename="study-plan.md" /> : null}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                </div>
              ) : output ? (
                <Markdown>{output}</Markdown>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Your prioritized schedule will appear here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">
                Study tasks
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {completed}/{tasks.value.length} done
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_140px_150px_auto]">
                <Input
                  placeholder="Task (e.g. Practice 10 calculus problems)"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Input
                  placeholder="Subject"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                />
                <Input
                  type="date"
                  value={newTask.due}
                  onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                />
                <Button onClick={addTask} type="button">
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              <ul className="space-y-2">
                {tasks.value.length === 0 ? (
                  <li className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                    No tasks yet — add one above to start tracking.
                  </li>
                ) : (
                  tasks.value.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(t.id)}
                        className="text-muted-foreground transition-colors hover:text-primary"
                        aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                      >
                        {t.done ? (
                          <CheckCircle2 className="size-5 text-success" />
                        ) : (
                          <Circle className="size-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            t.done ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {t.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.subject}
                          {t.due ? ` · due ${t.due}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(t.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Delete task"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <AiDisclaimer />
    </div>
  );
}
