import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import CarbonAvatar from "@/components/CarbonAvatar";
import { useProfile } from "@/lib/profile-store";
import { Info } from "lucide-react";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateFootprint,
  regionalAverage,
  scoreFootprint,
  percentile,
  topInsights,
} from "@/lib/carbon/calculator";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Carbon Twin" },
      { name: "description", content: "Your annual carbon footprint, score, and top insights." },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["#16a34a", "#22c55e", "#84cc16", "#a3e635"];
type AvatarAction = NonNullable<React.ComponentProps<typeof CarbonAvatar>["recentActions"]>[number];
const WORKSPACE_KEY = "carbon-twin-workspace";

type OrganizationWorkspace = {
  organizationName: string;
  workspaceCode: string;
  workspaceType: "Company" | "University";
  consentToAggregate: true;
  sharingLevel: "Anonymized category-level trends only";
};

const WORKSPACE_BENCHMARKS: Record<
  string,
  {
    annualKgCO2e: number;
    label: string;
    items: Array<{ label: string; value: string }>;
  }
> = {
  "ALPINETECH-2026": {
    annualKgCO2e: 7200,
    label: "AlpineTech employee benchmark",
    items: [
      { label: "Commuting", value: "34%" },
      { label: "Business travel", value: "25%" },
      { label: "Meals + procurement", value: "33%" },
    ],
  },
  "EPFL-CLIMATE": {
    annualKgCO2e: 6800,
    label: "EPFL participant benchmark",
    items: [
      { label: "Commuting", value: "31%" },
      { label: "Food choices", value: "22%" },
      { label: "Home + study energy", value: "18%" },
    ],
  },
};

function Dashboard() {
  const { profile } = useProfile();
  const [workspace, setWorkspace] = useState<OrganizationWorkspace | null>(null);
  const data = useMemo(() => {
    if (!profile) return null;
    const b = calculateFootprint(profile);
    const avg = regionalAverage(profile.country);
    return {
      breakdown: b,
      avg,
      score: scoreFootprint(b.total, avg),
      pct: percentile(b.total, avg),
      insights: topInsights(profile, b),
    };
  }, [profile]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_KEY);
      setWorkspace(raw ? (JSON.parse(raw) as OrganizationWorkspace) : null);
    } catch {
      localStorage.removeItem(WORKSPACE_KEY);
      setWorkspace(null);
    }
  }, []);

  if (!profile || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">No profile yet</h1>
        <p className="mt-2 text-muted-foreground">Build your carbon twin to see your dashboard.</p>
        <Link
          to="/profile"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Build my profile
        </Link>
      </main>
    );
  }

  const pieData = [
    { name: "Food", value: Math.round(data.breakdown.food) },
    { name: "Travel", value: Math.round(data.breakdown.travel) },
    { name: "Shopping", value: Math.round(data.breakdown.shopping) },
    { name: "Home", value: Math.round(data.breakdown.home) },
  ];
  const annualFootprintItems = pieData.map((item) => ({
    label: item.name,
    value: `${item.value.toLocaleString()} kg/yr`,
  }));

  const barData = [
    { name: "You", kg: Math.round(data.breakdown.total) },
    { name: `${profile.country} avg`, kg: data.avg },
  ];
  const avatarActions: AvatarAction[] = [
    profile.trainKmPerWeek > profile.carKmPerWeek ? "train" : null,
    profile.beefMealsPerWeek <= 1 ? "seasonal_food" : null,
    profile.secondHandSharePct >= 30 ? "second_hand" : null,
  ].filter((action): action is AvatarAction => action !== null);
  const avatarCaption =
    data.score === "A" || data.score === "B"
      ? "Your twin is thriving. Keep the low-carbon habits visible."
      : data.score === "C"
        ? "Your twin is steady. Food and travel are the next levers."
        : "Your twin has clear recovery levers. Start with the biggest category.";
  const footprintRatio = Math.min(100, Math.round((data.breakdown.total / data.avg) * 100));
  const belowAverageKg = Math.max(0, Math.round(data.avg - data.breakdown.total));
  const workspaceBenchmark = workspace ? WORKSPACE_BENCHMARKS[workspace.workspaceCode] : null;
  const comparisonKg = workspaceBenchmark?.annualKgCO2e ?? data.avg;
  const comparisonRatio = Math.min(100, Math.round((data.breakdown.total / comparisonKg) * 100));
  const comparisonDeltaKg = Math.round(comparisonKg - data.breakdown.total);
  const twinSignals = [
    profile.seasonalLocalFood === "often" ? "Keep choosing seasonal Vaud produce" : null,
    profile.trainKmPerWeek > profile.carKmPerWeek
      ? "Keep train-first trips for longer routes"
      : null,
    profile.secondHandSharePct >= 30 ? "Buy clothing second-hand first" : null,
    profile.heatingType === "heat_pump" || profile.heatingType === "district"
      ? "Hold steady on lower-carbon heating"
      : null,
    profile.personalGoals?.includes("save_money") ? "Prioritize swaps that also save money" : null,
    profile.personalGoals?.includes("health") ? "Prefer healthy low-carbon meals" : null,
    profile.personalGoals?.includes("local_community") ? "Use local repair and swap options" : null,
  ].filter((signal): signal is string => Boolean(signal));

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Your carbon twin</p>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">Living footprint</h1>
                <InfoTip text="A carbon footprint is the estimated greenhouse gas emissions caused by your food, travel, shopping, and home habits, shown as CO2e." />
              </div>
              <p className="mt-1 text-muted-foreground">
                {profile.city || profile.region || profile.country} · estimated annual CO
                <sub>2</sub>e
              </p>
            </div>
            <Link
              to="/profile"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm hover:text-foreground"
            >
              Edit profile
            </Link>
          </header>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-4">
              <SectionKicker
                eyebrow="Personal footprint"
                title="Your yearly estimate and comparison context"
                body="These cards turn your saved profile into annual CO2e estimates, then compare them with a regional or workspace benchmark."
              />
            </div>
            <Stat
              label="Your annual footprint"
              value={`${(data.breakdown.total / 1000).toFixed(1)} t`}
              sub="CO2e / year"
              accent="emerald"
              progress={footprintRatio}
              detail={
                belowAverageKg > 0
                  ? `${belowAverageKg} kg below the Swiss average`
                  : "Above the regional average; focus on top categories"
              }
              footer="Your personal estimate plus unavoidable shared systems."
              benchmarkItems={annualFootprintItems}
              tip="Reducing this matters because lower demand for high-emission choices means less energy, fuel, and material production over time. It cannot realistically reach zero because every country has shared systems like healthcare, roads, schools, and public services."
            />
            <Stat
              label={
                workspace ? `${workspace.workspaceType} workspace` : `${profile.country} average`
              }
              value={`${(comparisonKg / 1000).toFixed(1)} t`}
              sub={workspace ? "avg CO2e / member / year" : "per capita / year"}
              accent="teal"
              progress={comparisonRatio}
              progressLabel={workspace ? "of workspace benchmark" : "of regional benchmark"}
              detail={
                workspace
                  ? `${comparisonDeltaKg >= 0 ? `${comparisonDeltaKg} kg below` : `${Math.abs(comparisonDeltaKg)} kg above`} ${workspace.organizationName}'s anonymized benchmark`
                  : "Reference point for your region"
              }
              footer={
                workspace
                  ? `${workspace.organizationName} only receives anonymized category-level trends, not your answers or advisor chat.`
                  : "Benchmark only. The advisor uses your saved habits and local context."
              }
              benchmarkItems={
                workspaceBenchmark?.items ?? [
                  { label: "Public services", value: "shared baseline" },
                  { label: "Homes + energy", value: "~25%" },
                  { label: "Mobility + goods", value: "~45%" },
                ]
              }
              chip={workspace ? "workspace" : "yearly"}
              tip={
                workspace
                  ? "This compares your private annual estimate with a mocked anonymized workspace benchmark. The organization sees category-level trends only."
                  : "This compares your annual estimate with a regional per-person yearly benchmark."
              }
            />
            <ScoreCard
              score={data.score ?? "B"}
              pct={data.pct}
              recentActions={avatarActions}
              caption={avatarCaption}
              signals={twinSignals}
            />
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <SectionKicker
              eyebrow="Progress signals"
              title="Change over time"
              body="Prototype progress indicators help the app feel like a companion, not just a calculator."
            />
          </div>
          <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Progress</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">↓ 14%</p>
            <p className="mt-1 text-sm text-muted-foreground">estimated this month</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Avoided impact
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">~220 kg</p>
            <p className="mt-1 text-sm text-muted-foreground">CO2e this quarter</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Local context
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight">
              {profile.city || "Lausanne"}, {profile.region || "Vaud"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimates are directional and based on public emissions datasets.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 shadow-sm md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Private by default
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your profile answers and advisor conversation stay on your device by default. If you
              join a workspace, the organization only sees anonymized category-level trends across
              people.
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Breakdown</h2>
                <InfoTip text="Categories are annual estimates. Bigger categories usually deserve attention first because they can save more CO2e." />
              </div>
              <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-primary">
                kg CO<sub>2</sub>e / year
              </span>
            </div>
            <div className="mt-2 h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    formatter={(v: number) => `${v} kg CO2e/year`}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      boxShadow: "0 8px 24px oklch(0 0 0 / 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-medium">{d.value} kg/yr</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">vs regional average</h2>
              <InfoTip text="This compares your estimated annual footprint with a regional per-person yearly average." />
            </div>
            <div className="mt-2 h-56">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={false}
                    formatter={(v: number) => `${v} kg CO2e/year`}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      boxShadow: "0 8px 24px oklch(0 0 0 / 0.08)",
                    }}
                  />
                  <Bar dataKey="kg" radius={[8, 8, 0, 0]} fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Top personalized insights</h2>
            <InfoTip text="Individual actions add up most when they change repeated habits or avoid very high-emission choices." />
          </div>
          <ul className="mt-4 space-y-3">
            {data.insights.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Nice — your numbers are well-balanced. Keep it up.
              </li>
            )}
            {data.insights.map((t, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-[var(--primary-soft)]/40 p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </TooltipProvider>
  );
}

function SectionKicker({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-[var(--primary-soft)] hover:text-primary"
          aria-label="More information"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs leading-5">{text}</TooltipContent>
    </UiTooltip>
  );
}

function Stat({
  label,
  value,
  sub,
  tip,
  detail,
  footer,
  progress,
  progressLabel = "of benchmark",
  accent = "emerald",
  benchmarkItems,
  chip = "yearly",
}: {
  label: string;
  value: string;
  sub: string;
  tip?: string;
  detail?: string;
  footer?: string;
  progress?: number;
  progressLabel?: string;
  accent?: "emerald" | "teal";
  benchmarkItems?: Array<{ label: string; value: string }>;
  chip?: string;
}) {
  const accentClasses =
    accent === "teal"
      ? {
          gradient: "from-teal-50/95 via-card to-emerald-50/50",
          text: "text-teal-700",
          bar: "bg-teal-500",
          glow: "bg-teal-100/70",
        }
      : {
          gradient: "from-emerald-50/95 via-card to-lime-50/50",
          text: "text-primary",
          bar: "bg-primary",
          glow: "bg-emerald-100/70",
        };

  return (
    <div
      className={`relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:min-h-[29rem] ${accentClasses.gradient}`}
    >
      <div
        className={`absolute -right-12 -top-14 h-32 w-32 rounded-full blur-2xl ${accentClasses.glow}`}
      />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          {tip ? <InfoTip text={tip} /> : null}
        </div>
        <span
          className={`shrink-0 rounded-full bg-card/75 px-2.5 py-1 text-[11px] font-medium ${accentClasses.text}`}
        >
          {chip}
        </span>
      </div>
      <div className="relative mt-5">
        <p className="text-5xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{sub}</p>
        {detail ? (
          <div className="mt-4 rounded-2xl bg-card/75 p-3 shadow-sm">
            <p className="text-sm font-medium leading-5 text-foreground">{detail}</p>
          </div>
        ) : null}
      </div>
      <div className="relative mt-4 space-y-3">
        {typeof progress === "number" ? (
          <div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className={`h-2 rounded-full ${accentClasses.bar}`}
                style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
              />
            </div>
            <p className={`mt-2 text-xs font-medium ${accentClasses.text}`}>
              {progress}% {progressLabel}
            </p>
          </div>
        ) : null}
        {benchmarkItems ? (
          <div className="grid gap-2">
            {benchmarkItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl bg-card/75 px-3 py-2 text-xs shadow-sm"
              >
                <span className="min-w-0 text-muted-foreground">{item.label}</span>
                <span className="shrink-0 font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        {footer ? <p className="text-xs leading-5 text-muted-foreground">{footer}</p> : null}
      </div>
    </div>
  );
}

function ScoreCard({
  score,
  pct,
  recentActions,
  caption,
  signals,
}: {
  score: "A" | "B" | "C" | "D" | "E";
  pct: number;
  recentActions: AvatarAction[];
  caption: string;
  signals: string[];
}) {
  const colors: Record<string, string> = {
    A: "bg-emerald-500",
    B: "bg-green-500",
    C: "bg-yellow-500",
    D: "bg-orange-500",
    E: "bg-red-500",
  };
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-emerald-50/70 p-6 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Carbon twin score</p>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white ${colors[score]}`}
        >
          {score}
        </span>
      </div>
      <div className="mt-3 grid items-start gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <AvatarPlot score={score} recentActions={recentActions} signals={signals} />
        <div className="mt-4 rounded-2xl bg-card/70 p-4 md:mt-6">
          <p className="text-3xl font-semibold tracking-tight">Top {100 - pct}%</p>
          <p className="mt-1 text-sm text-muted-foreground">lower than {pct}% in your region</p>
          <div className="mt-4 h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.max(10, 100 - pct)}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            The tree grows from your saved profile: food, travel, shopping, home energy, and goals.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(signals.length
          ? signals
          : ["Profile is ready for contextual advice", "Use local context before generic tips"]
        )
          .slice(0, 4)
          .map((signal) => (
            <span
              key={signal}
              className="rounded-2xl border border-emerald-200/80 bg-card/80 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm"
            >
              {signal}
            </span>
          ))}
      </div>
    </div>
  );
}

function AvatarPlot({
  score,
  recentActions,
  signals,
}: {
  score: "A" | "B" | "C" | "D" | "E";
  recentActions: AvatarAction[];
  signals: string[];
}) {
  return (
    <div className="relative mx-auto grid min-h-60 w-full max-w-72 place-items-end overflow-hidden rounded-[2rem] bg-gradient-to-b from-emerald-50/10 via-emerald-50/45 to-emerald-100/85">
      <div className="absolute inset-x-6 bottom-8 h-16 rounded-[50%] bg-emerald-200/45 blur-xl" />
      <div className="relative z-10 mb-5 translate-y-4">
        <CarbonAvatar score={score} recentActions={recentActions} size="lg" />
      </div>
      <AvatarMeadow score={score} signals={signals} />
    </div>
  );
}

function AvatarMeadow({
  score,
  signals,
}: {
  score: "A" | "B" | "C" | "D" | "E";
  signals: string[];
}) {
  const hasTravel = signals.some((signal) => signal.includes("train"));
  const hasCommunity = signals.some((signal) => signal.includes("community"));
  const flowerCount =
    score === "A" ? 4 : score === "B" ? 3 : score === "C" ? 2 : score === "D" ? 1 : 0;
  const dryLeaves = score === "D" || score === "E";

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3">
      <svg viewBox="0 0 180 62" className="h-20 w-full" aria-hidden="true">
        <ellipse
          cx="90"
          cy="48"
          rx="78"
          ry="8"
          fill={score === "E" ? "#d6d3a8" : "#bbf7d0"}
          opacity="0.9"
        />
        <path
          d="M13 49 C35 27 69 39 91 29 C117 15 148 30 167 49Z"
          fill={score === "E" ? "#c6b86e" : score === "D" ? "#bef264" : "#86efac"}
          opacity="0.58"
        />
        <path
          d="M28 49 C54 38 72 47 91 38 C111 30 136 38 154 49Z"
          fill={score === "E" ? "#b59b53" : "#4ade80"}
          opacity="0.32"
        />
        {Array.from({ length: flowerCount }).map((_, i) => {
          const x = 42 + i * 28;
          const y = i % 2 === 0 ? 39 : 34;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle cx="0" cy="-3" r="3" fill="#f9a8d4" />
              <circle cx="3" cy="0" r="3" fill="#fbcfe8" />
              <circle cx="0" cy="3" r="3" fill="#f9a8d4" />
              <circle cx="-3" cy="0" r="3" fill="#fbcfe8" />
              <circle cx="0" cy="0" r="1.6" fill="#fde68a" />
            </g>
          );
        })}
        {dryLeaves && (
          <g fill={score === "E" ? "#9a7a45" : "#a3a36b"} opacity="0.85">
            <path d="M45 42 C55 35 63 39 66 40 C60 50 51 51 45 42Z" />
            <path d="M116 38 C126 32 134 36 137 37 C131 47 122 48 116 38Z" />
            <path d="M82 48 C90 43 96 45 99 47 C94 54 87 55 82 48Z" />
          </g>
        )}
        {hasTravel && (
          <g fill="#059669">
            <rect x="14" y="33" width="17" height="10" rx="3" />
            <circle cx="18" cy="45" r="2" />
            <circle cx="27" cy="45" r="2" />
          </g>
        )}
        {hasCommunity && (
          <g fill="#10b981" opacity="0.9">
            <circle cx="145" cy="18" r="3" />
            <circle cx="138" cy="22" r="3" />
            <circle cx="152" cy="22" r="3" />
          </g>
        )}
      </svg>
    </div>
  );
}
