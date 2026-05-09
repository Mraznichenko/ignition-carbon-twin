import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Shirt, TrainFront, Apple, Bike } from "lucide-react";

export const Route = createFileRoute("/local-actions")({
  head: () => ({
    meta: [
      { title: "Local Actions — Carbon Twin" },
      { name: "description", content: "Real things to do this month near you." },
    ],
  }),
  component: LocalActions,
});

const ACTIONS = [
  {
    icon: Wrench,
    title: "Repair Café Lausanne",
    tag: "Every 2nd Saturday",
    desc: "Bring a broken appliance, bike, or piece of clothing. Volunteers help you fix it for free.",
    impact: "~15 kg CO2e per item saved from landfill",
  },
  {
    icon: Shirt,
    title: "Second-hand clothing swap",
    tag: "Monthly",
    desc: "Bring 3 items, take 3 home. A relaxed evening at Le Local with drinks and music.",
    impact: "~22 kg CO2e per garment vs new",
  },
  {
    icon: TrainFront,
    title: "Train-first weekend planner",
    tag: "Always on",
    desc: "Curated weekend trips reachable by train within 4 hours of Lausanne, with full timetables.",
    impact: "Up to 90% lower than driving",
  },
  {
    icon: Apple,
    title: "Seasonal Swiss food basket",
    tag: "Weekly delivery",
    desc: "Vegetables grown within 50 km, picked the day before. No greenhouse heating, no air freight.",
    impact: "~3× lower than out-of-season imports",
  },
  {
    icon: Bike,
    title: "Bike-to-campus challenge",
    tag: "Spring 2026",
    desc: "Join 200 students cycling to EPFL/UNIL for a month. Free tune-ups and weekly prizes.",
    impact: "~500 kg CO2e saved across the group",
  },
];

function LocalActions() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Local actions</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">
        Small, real, doable. Curated for your area — no greenwashing, no offset gimmicks.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((a) => (
          <article
            key={a.title}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <a.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{a.tag}</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">{a.title}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{a.desc}</p>
            <p className="mt-4 border-t border-border pt-3 text-xs font-medium text-primary">{a.impact}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
