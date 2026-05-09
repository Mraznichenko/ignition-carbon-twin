import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Salad, Plane, Gauge, MapPin } from "lucide-react";
import CarbonAvatar from "@/components/CarbonAvatar";
import { DEMO_PROFILE } from "@/lib/carbon/calculator";
import { useProfile } from "@/lib/profile-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carbon Twin — Your personal AI carbon digital twin" },
      {
        name: "description",
        content:
          "An AI agent that learns how you eat, shop, and travel — and helps you cut CO2 only where it actually matters.",
      },
      { property: "og:title", content: "Carbon Twin" },
      {
        property: "og:description",
        content: "Context-aware climate advice for your real life.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Salad,
    title: "Context-aware food advice",
    body: "Your usual meals matter more than generic food rules. The twin looks at protein, season, and your own diet pattern.",
  },
  {
    icon: Plane,
    title: "Travel emissions optimizer",
    body: "Train vs car vs flight, scored on your actual route — not generic averages.",
  },
  {
    icon: Gauge,
    title: "Regional footprint score",
    body: "Compare your annual CO2e to your country and city. Get a clear A–E grade.",
  },
  {
    icon: MapPin,
    title: "Local action recommendations",
    body: "Repair cafés, swap nights, seasonal baskets — real things to do near you.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const { setProfile } = useProfile();

  const loadDemoMode = () => {
    setProfile(DEMO_PROFILE);
    localStorage.setItem(
      "carbon-twin-workspace",
      JSON.stringify({
        organizationName: "AlpineTech SA",
        workspaceCode: "ALPINETECH-2026",
        workspaceType: "Company",
        consentToAggregate: true,
        sharingLevel: "Anonymized category-level trends only",
      }),
    );
    window.dispatchEvent(new Event("carbon-twin-workspace-change"));
    navigate({ to: "/dashboard" });
  };

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:pt-16">
        <div className="grid items-center gap-8 rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Context-aware climate intelligence
            </span>
            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Meet your <span className="text-primary">carbon twin</span>
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
              It learns how you eat, shop, and travel, then only intervenes when context changes the
              answer.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                to="/profile"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Build my carbon twin <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/company"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Explore company dashboard
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadDemoMode}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-primary shadow-sm hover:bg-emerald-100"
              >
                Load sample workspace
              </button>
              <p className="text-xs leading-5 text-muted-foreground">
                Loads a Lausanne profile, joins AlpineTech, and opens the dashboard.
              </p>
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-gradient-to-br from-[var(--primary-soft)] via-card to-secondary p-6 text-center">
            <HeroTwinPreview />
            <div className="mt-5 rounded-2xl bg-card/90 p-4 text-left shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Today’s context
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your diet pattern, route, and shopping habits decide what is worth changing. The
                twin focuses on swaps that actually move your footprint.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 grid max-w-6xl gap-3 rounded-3xl border border-emerald-200/80 bg-white/80 p-4 shadow-sm md:grid-cols-5">
          {["Build twin", "Join workspace", "See dashboard", "Ask advisor", "Generate summary"].map(
            (step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 px-3 py-2 text-sm font-medium text-foreground"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                  {index + 1}
                </span>
                {step}
              </div>
            ),
          )}
        </div>

        <div className="relative mx-auto mt-10 grid max-w-6xl auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex h-full flex-col rounded-2xl border border-border bg-card/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-primary">For individuals</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Build a private twin</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Understand your own food, travel, shopping, and home energy footprint, then get
              contextual advice you can actually act on.
            </p>
            <Link
              to="/profile"
              className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Build my carbon twin
            </Link>
          </div>
          <div className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/95 to-card p-6 shadow-sm">
            <p className="text-sm font-medium text-teal-700">For companies</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Turn twins into company insight
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Aggregate anonymized employee and operational signals into reduction campaigns,
              marketplace workflows, and ESRS-style reporting-support summaries.
            </p>
            <Link
              to="/company"
              className="mt-5 inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white"
            >
              Explore company dashboard
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-100/90 via-teal-50/95 to-card p-8 shadow-sm md:p-12">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Why context matters
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            Generic climate advice is bad advice.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The same product can have very different emissions depending on season and location.
            Carbon Twin only suggests changes when the swap actually moves the needle for you,
            today, where you live.
          </p>
        </div>
      </section>
    </main>
  );
}

function HeroTwinPreview() {
  return (
    <div className="relative mx-auto grid min-h-60 w-full max-w-72 place-items-end overflow-hidden rounded-[2rem] bg-gradient-to-b from-emerald-50/10 via-emerald-50/45 to-emerald-100/85">
      <div className="absolute inset-x-6 bottom-8 h-16 rounded-[50%] bg-emerald-200/45 blur-xl" />
      <div className="relative z-10 mb-5 translate-y-4">
        <CarbonAvatar score="A" size="lg" />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3">
        <svg viewBox="0 0 180 62" className="h-20 w-full" aria-hidden="true">
          <ellipse cx="90" cy="48" rx="78" ry="8" fill="#bbf7d0" opacity="0.9" />
          <path
            d="M13 49 C35 27 69 39 91 29 C117 15 148 30 167 49Z"
            fill="#86efac"
            opacity="0.58"
          />
          <path
            d="M28 49 C54 38 72 47 91 38 C111 30 136 38 154 49Z"
            fill="#4ade80"
            opacity="0.32"
          />
          {[42, 70, 98, 126].map((x, i) => (
            <g key={x} transform={`translate(${x} ${i % 2 === 0 ? 39 : 34})`}>
              <circle cx="0" cy="-3" r="3" fill="#f9a8d4" />
              <circle cx="3" cy="0" r="3" fill="#fbcfe8" />
              <circle cx="0" cy="3" r="3" fill="#f9a8d4" />
              <circle cx="-3" cy="0" r="3" fill="#fbcfe8" />
              <circle cx="0" cy="0" r="1.6" fill="#fde68a" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
