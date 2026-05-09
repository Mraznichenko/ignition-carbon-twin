import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProfile } from "@/lib/profile-store";
import { DEMO_PROFILE, EMPTY_PROFILE } from "@/lib/carbon/calculator";
import { inferProfileFromPrompt } from "@/lib/carbon/profileInferenceClient";
import type {
  CarbonProfile,
  ConnectedSource,
  HeatingType,
  PersonalGoal,
  SeasonalLocalHabit,
  Willingness,
} from "@/lib/carbon/types";
import { Sparkles } from "lucide-react";

const WORKSPACE_KEY = "carbon-twin-workspace";

type OrganizationWorkspace = {
  organizationName: string;
  workspaceCode: string;
  workspaceType: "Company" | "University";
  consentToAggregate: true;
  sharingLevel: "Anonymized category-level trends only";
};

const MOCK_WORKSPACES: Record<string, OrganizationWorkspace> = {
  "ALPINETECH-2026": {
    organizationName: "AlpineTech SA",
    workspaceCode: "ALPINETECH-2026",
    workspaceType: "Company",
    consentToAggregate: true,
    sharingLevel: "Anonymized category-level trends only",
  },
  "EPFL-CLIMATE": {
    organizationName: "EPFL Climate Program",
    workspaceCode: "EPFL-CLIMATE",
    workspaceType: "University",
    consentToAggregate: true,
    sharingLevel: "Anonymized category-level trends only",
  },
};

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Carbon Twin" },
      {
        name: "description",
        content: "Tell Carbon Twin how you live so it can give context-aware advice.",
      },
    ],
  }),
  component: ProfilePage,
});

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-white/80 px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2";

function ProfilePage() {
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState<CarbonProfile>({ ...EMPTY_PROFILE, ...profile });
  const [profilePrompt, setProfilePrompt] = useState("");
  const [profilePromptError, setProfilePromptError] = useState("");
  const [isInferringProfile, setIsInferringProfile] = useState(false);
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [workspace, setWorkspace] = useState<OrganizationWorkspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");

  const update = <K extends keyof CarbonProfile>(k: K, v: CarbonProfile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (profile) setForm({ ...EMPTY_PROFILE, ...profile });
  }, [profile]);

  useEffect(() => {
    try {
      const savedWorkspace = localStorage.getItem(WORKSPACE_KEY);
      if (savedWorkspace) {
        const parsed = JSON.parse(savedWorkspace) as OrganizationWorkspace;
        setWorkspace(parsed);
        setWorkspaceCode(parsed.workspaceCode);
      }
    } catch {
      localStorage.removeItem(WORKSPACE_KEY);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(form);
    navigate({ to: "/dashboard" });
  };

  const joinWorkspace = () => {
    const normalizedCode = workspaceCode.trim().toUpperCase();
    const nextWorkspace = MOCK_WORKSPACES[normalizedCode];

    if (!nextWorkspace) {
      setWorkspaceError("Workspace code not recognized in this prototype.");
      return;
    }

    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(nextWorkspace));
    window.dispatchEvent(new Event("carbon-twin-workspace-change"));
    setWorkspace(nextWorkspace);
    setWorkspaceCode(nextWorkspace.workspaceCode);
    setWorkspaceError("");
  };

  const fillFromPrompt = async (mode: "replace" | "add" = "replace") => {
    if (!profilePrompt.trim()) return;
    setIsInferringProfile(true);
    setProfilePromptError("");
    try {
      const currentProfile = mode === "add" && profile ? { ...EMPTY_PROFILE, ...profile } : form;
      const result = await inferProfileFromPrompt(profilePrompt, currentProfile);
      setForm(result.profile);
      if (mode === "add") setProfile(result.profile);
    } catch (error) {
      setProfilePromptError(error instanceof Error ? error.message : "Could not infer profile.");
    } finally {
      setIsInferringProfile(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Carbon Twin setup</p>
            <h1 className="text-3xl font-semibold tracking-tight">Build your carbon twin</h1>
            <p className="mt-1 text-muted-foreground">
              Describe yourself in plain language, then review the editable numbers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(DEMO_PROFILE)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Sparkles className="h-4 w-4" /> Load demo profile
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <Section title="Describe your lifestyle">
          <div className="space-y-3">
            <textarea
              value={profilePrompt}
              onChange={(event) => setProfilePrompt(event.target.value)}
              placeholder="Example: I live in Lausanne, commute mostly by train, drive on weekends, eat beef once or twice a week, fly a few times a year, and buy clothes occasionally."
              className={`${inputCls} min-h-28 resize-y`}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                The twin fills the fields below; you stay in control before saving.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillFromPrompt("replace")}
                  disabled={isInferringProfile || !profilePrompt.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isInferringProfile ? "Building..." : "Build my twin"}
                </button>
                <button
                  type="button"
                  onClick={() => fillFromPrompt("add")}
                  disabled={isInferringProfile || !profilePrompt.trim() || !profile}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to saved twin
                </button>
              </div>
            </div>
            {profilePromptError && <p className="text-xs text-destructive">{profilePromptError}</p>}
          </div>
        </Section>

        <Section title="Where you live">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Country">
              <select
                className={inputCls}
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              >
                {["CH", "DE", "FR", "UK", "US"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Region">
              <input
                className={inputCls}
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
              />
            </Field>
            <Field label="City">
              <input
                className={inputCls}
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </Field>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            We use this to make recommendations feel local, for example Lausanne/Vaud seasonality,
            Swiss transport choices, and nearby repair or second-hand options.
          </p>
        </Section>

        <Section title="Optional organization workspace">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm leading-6 text-muted-foreground">
                Use Carbon Twin privately, or connect your carbon twin to a company, university, or
                city workspace. Your personal answers and advisor conversation stay private. The
                organization only receives anonymized category-level trends.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  className={inputCls}
                  value={workspaceCode}
                  onChange={(event) => {
                    setWorkspaceCode(event.target.value);
                    setWorkspaceError("");
                  }}
                  placeholder="ALPINETECH-2026"
                />
                <button
                  type="button"
                  onClick={joinWorkspace}
                  className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Join workspace
                </button>
              </div>
              {workspaceError && <p className="mt-2 text-xs text-destructive">{workspaceError}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                Demo codes: ALPINETECH-2026 or EPFL-CLIMATE. No authentication or server sync is
                used.
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                workspace
                  ? "border-primary/30 bg-[var(--primary-soft)]"
                  : "border-border bg-white/70"
              }`}
            >
              {workspace ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Connected workspace
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    Connected to {workspace.organizationName}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Your carbon twin remains private. {workspace.organizationName} only sees
                    aggregated trends across{" "}
                    {workspace.workspaceType === "Company" ? "employees" : "participants"}.
                  </p>
                  <dl className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-4">
                      <dt>Workspace type</dt>
                      <dd className="font-medium text-foreground">{workspace.workspaceType}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Sharing level</dt>
                      <dd className="max-w-44 text-right font-medium text-foreground">
                        {workspace.sharingLevel}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Private by default
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">No workspace connected</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    You can use Carbon Twin as an individual app. Joining a workspace only enables
                    anonymized category trends for the organization dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="Diet" hint="meals per week">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Beef meals">
              <NumberInput
                value={form.beefMealsPerWeek}
                onChange={(value) => update("beefMealsPerWeek", value)}
              />
            </Field>
            <Field label="Other meat / fish">
              <NumberInput
                value={form.otherMeatMealsPerWeek}
                onChange={(value) => update("otherMeatMealsPerWeek", value)}
              />
            </Field>
            <Field label="Vegetarian">
              <NumberInput
                value={form.vegetarianMealsPerWeek}
                onChange={(value) => update("vegetarianMealsPerWeek", value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Travel" hint="rough weekly distance; natural language works best above">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Car travel" hint="km / week">
              <NumberInput
                value={form.carKmPerWeek}
                onChange={(value) => update("carKmPerWeek", value)}
              />
            </Field>
            <Field label="Train travel" hint="km / week">
              <NumberInput
                value={form.trainKmPerWeek}
                onChange={(value) => update("trainKmPerWeek", value)}
              />
            </Field>
            <Field label="Flights / year">
              <NumberInput
                value={form.flightsPerYear}
                onChange={(value) => update("flightsPerYear", value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Shopping">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="New clothes / month">
              <NumberInput
                value={form.newClothesPerMonth}
                onChange={(value) => update("newClothesPerMonth", value)}
              />
            </Field>
            <Field label="Second-hand share %">
              <NumberInput
                value={form.secondHandSharePct}
                max={100}
                onChange={(value) => update("secondHandSharePct", value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Seasonality awareness" hint="food context">
          <SegmentedField<SeasonalLocalHabit>
            label="I buy seasonal/local food"
            value={form.seasonalLocalFood}
            options={[
              { value: "rarely", label: "Rarely" },
              { value: "sometimes", label: "Sometimes" },
              { value: "often", label: "Often" },
            ]}
            onChange={(value) => update("seasonalLocalFood", value)}
          />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            This helps Carbon Twin treat food as context-sensitive: local summer vegetables can be
            very different from winter greenhouse production or imported produce.
          </p>
        </Section>

        <Section title="Home energy" hint="estimated home footprint">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Home size" hint="m²">
              <NumberInput
                value={form.homeSizeM2}
                onChange={(value) => update("homeSizeM2", value)}
              />
            </Field>
            <Field label="People at home">
              <NumberInput
                value={form.householdSize}
                min={1}
                max={8}
                onChange={(value) => update("householdSize", value)}
              />
            </Field>
            <HeatingField
              value={form.heatingType}
              onChange={(value) => update("heatingType", value)}
            />
            <Field label="Shower time" hint="minutes / day">
              <NumberInput
                value={form.showerMinutesPerDay}
                max={60}
                onChange={(value) => update("showerMinutesPerDay", value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Preferences">
          <div className="grid gap-4 md:grid-cols-3">
            <WillingnessField
              label="Budget sensitivity"
              value={form.budgetSensitivity}
              onChange={(v) => update("budgetSensitivity", v)}
            />
            <WillingnessField
              label="Willingness to change diet"
              value={form.willingnessDiet}
              onChange={(v) => update("willingnessDiet", v)}
            />
            <WillingnessField
              label="Willingness to change travel"
              value={form.willingnessTravel}
              onChange={(v) => update("willingnessTravel", v)}
            />
          </div>
        </Section>

        <Section title="AI personal goals">
          <CheckboxGroup<PersonalGoal>
            values={form.personalGoals}
            options={[
              { value: "save_money", label: "Save money" },
              { value: "reduce_emissions", label: "Reduce emissions" },
              { value: "convenience", label: "Convenience" },
              { value: "health", label: "Health" },
              { value: "local_community", label: "Local community" },
            ]}
            onChange={(values) => update("personalGoals", values)}
          />
        </Section>

        <Section title="Connected sources" hint="simulation">
          <CheckboxGroup<ConnectedSource>
            values={form.connectedSources}
            options={[
              { value: "grocery_receipts", label: "Grocery receipts" },
              { value: "calendar_travel", label: "Calendar travel" },
              { value: "shopping_history", label: "Shopping history" },
            ]}
            onChange={(values) => update("connectedSources", values)}
          />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Future versions can automatically learn from connected data. For now, these are manual
            signals for the prototype.
          </p>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Save & view dashboard
          </button>
        </div>
      </form>
    </main>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    setDraft(raw);

    const normalized = raw.trim().replace(",", ".");
    if (normalized === "") return;

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return;

    onChange(Math.min(max ?? parsed, Math.max(min, parsed)));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={inputCls}
      value={draft}
      onChange={(event) => commit(event.target.value)}
      onBlur={() => {
        if (draft === "") {
          setDraft("0");
          onChange(0);
          return;
        }
        setDraft(String(value));
      }}
    />
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function WillingnessField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Willingness;
  onChange: (v: Willingness) => void;
}) {
  const opts: Willingness[] = ["low", "medium", "high"];
  return (
    <Field label={label}>
      <div className="inline-flex w-full rounded-xl border border-border bg-card p-1">
        {opts.map((o) => (
          <button
            type="button"
            key={o}
            onClick={() => onChange(o)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition ${
              value === o
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </Field>
  );
}

function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <div className="inline-flex w-full rounded-xl border border-border bg-card p-1">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
              value === option.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

function CheckboxGroup<T extends string>({
  values,
  options,
  onChange,
}: {
  values: T[];
  options: Array<{ value: T; label: string }>;
  onChange: (values: T[]) => void;
}) {
  const selected = values ?? [];
  const toggle = (value: T) => {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    );
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white/70 px-3 py-2 text-sm transition hover:border-primary"
        >
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function HeatingField({
  value,
  onChange,
}: {
  value: HeatingType;
  onChange: (v: HeatingType) => void;
}) {
  const options: Array<{ value: HeatingType; label: string }> = [
    { value: "unknown", label: "I don't know" },
    { value: "district", label: "District heating" },
    { value: "heat_pump", label: "Heat pump" },
    { value: "gas", label: "Gas" },
    { value: "oil", label: "Oil" },
    { value: "electric", label: "Electric" },
  ];

  return (
    <Field label="Heating type">
      <select
        className={inputCls}
        value={value}
        onChange={(event) => onChange(event.target.value as HeatingType)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
