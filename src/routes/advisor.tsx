import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/lib/profile-store";
import { advise, type AdvisorResponse } from "@/lib/carbon/advisor";
import { askKimiAdvisor } from "@/lib/carbon/kimiClient";
import {
  Send,
  Sparkles,
  TrendingDown,
  AlertCircle,
  Repeat,
  Clock,
  Leaf,
  ExternalLink,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "Advisor — Carbon Twin" },
      { name: "description", content: "Context-aware climate advice from your carbon twin." },
    ],
  }),
  component: Advisor,
});

const CHIPS = [
  "I want to cook beef with bell peppers tonight.",
  "Should I take the train or car from Lausanne to Milan?",
  "I need to buy a jacket this month.",
  "How can I reduce my footprint this week?",
];

interface Msg {
  id: string;
  role: "user" | "twin";
  text?: string;
  response?: AdvisorResponse;
  status?: "pending" | "kimi" | "offline";
  request?: {
    message: string;
    profile: Parameters<typeof askKimiAdvisor>[0]["profile"];
    localAdvice: AdvisorResponse;
  };
}

const STORAGE_KEY = "carbon-twin-advisor-thread";

type RecommendationLink = {
  label: string;
  href: string;
  reason: string;
};

function Advisor() {
  const { profile } = useProfile();
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Msg[]) : [];
      return saved;
    } catch {
      return [];
    }
  });
  const resumedRequests = useRef(new Set<string>());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      // Local persistence is helpful but non-critical.
    }
  }, [msgs]);

  const resolvePending = async (twinId: string, request: NonNullable<Msg["request"]>) => {
    const kimiAdvice = await askKimiAdvisor(request);
    setMsgs((m) =>
      m.map((msg) =>
        msg.id === twinId
          ? {
              ...msg,
              request: undefined,
              response: kimiAdvice,
              status: kimiAdvice.source === "kimi" ? "kimi" : "offline",
            }
          : msg,
      ),
    );
  };

  useEffect(() => {
    for (const msg of msgs) {
      if (msg.role !== "twin" || msg.status !== "pending" || !msg.request) continue;
      if (resumedRequests.current.has(msg.id)) continue;
      resumedRequests.current.add(msg.id);
      void resolvePending(msg.id, msg.request);
    }
  }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const localAdvice = advise(text, profile);
    const request = { message: text, profile, localAdvice };
    const userId = crypto.randomUUID();
    const twinId = crypto.randomUUID();

    setMsgs((m) => [
      ...m,
      { id: userId, role: "user", text },
      { id: twinId, role: "twin", status: "pending", request },
    ]);
    setInput("");
    resumedRequests.current.add(twinId);
    void resolvePending(twinId, request);
  };

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-card/95 px-6 py-7 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Context-aware carbon advice
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Ask your carbon twin</h1>
            <InfoTip text="Carbon footprint means the greenhouse gas impact of a choice, counted as CO2e so different gases can be compared." />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ask about a meal, trip, or purchase. The twin checks your profile and local data before
            deciding whether the choice actually matters.
          </p>
        </div>

        <div className="mt-6 rounded-[2rem] border border-border bg-card/55 p-4 shadow-sm">
          <div className="space-y-4">
            {msgs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center text-muted-foreground">
                <Leaf className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-sm">Try a starter prompt or type your own.</p>
              </div>
            )}

            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <ResponseCard key={i} r={m.response} status={m.status} />
              ),
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition hover:border-primary hover:text-foreground"
            >
              {c}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-4 mt-4 flex items-center gap-2 rounded-full border border-border bg-card/95 p-2 shadow-md"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your carbon twin…"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        {msgs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              resumedRequests.current.clear();
              setMsgs([]);
            }}
            className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear conversation
          </button>
        )}
      </main>
    </TooltipProvider>
  );
}

function ResponseCard({ r, status }: { r?: AdvisorResponse; status?: Msg["status"] }) {
  if (status === "pending" || !r) {
    return (
      <div className="rounded-2xl rounded-tl-md border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 text-sm font-medium text-muted-foreground">
          Checking your profile and local carbon data...
        </div>
        <div className="h-2 w-40 animate-pulse rounded-full bg-[var(--primary-soft)]" />
      </div>
    );
  }

  const links = getRecommendationLinks(r);

  return (
    <div className="rounded-2xl rounded-tl-md border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Carbon Twin
            </p>
            <InfoTip text="The most impactful recommendations target repeated habits or high-emission categories, not every small choice." />
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Contextual recommendation</h2>
        </div>
        {r.reductionKg > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1.5 text-sm font-medium text-primary">
            <TrendingDown className="h-4 w-4" />~{r.reductionKg} kg CO<sub>2</sub>e saved
          </div>
        )}
      </div>
      <div className="mb-4 text-xs font-medium text-muted-foreground">
        {status === "kimi"
          ? "Enhanced with Kimi using your saved profile"
          : status === "offline"
            ? `Local deterministic advice; Kimi unavailable${r.kimiError ? ` (${r.kimiError})` : ""}`
            : "Local deterministic advice"}
      </div>
      <div className="grid gap-3">
        <Row icon={<AlertCircle className="h-4 w-4" />} label="Impact" text={r.diagnosis} />
        <Row icon={<Clock className="h-4 w-4" />} label="Why now" text={r.whyNow} />
        <Row icon={<Repeat className="h-4 w-4" />} label="Better swap" text={r.swap} />
      </div>
      {links.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Useful links
            </p>
            <InfoTip text="These links point to practical services; Carbon Twin does not need them to calculate the advice." />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-primary hover:text-primary"
                title={link.reason}
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getRecommendationLinks(r: AdvisorResponse): RecommendationLink[] {
  const text = `${r.diagnosis} ${r.whyNow} ${r.swap}`.toLowerCase();
  const links: RecommendationLink[] = [];
  const add = (link: RecommendationLink) => {
    if (!links.some((existing) => existing.href === link.href)) links.push(link);
  };

  if (
    text.includes("train") ||
    text.includes("car") ||
    text.includes("lausanne") ||
    text.includes("milan") ||
    text.includes("travel")
  ) {
    add({
      label: "SBB planner",
      href: "https://www.sbb.ch/en",
      reason: "Plan train-first routes from Lausanne and compare realistic journey times.",
    });
  }

  if (
    text.includes("jacket") ||
    text.includes("clothing") ||
    text.includes("clothes") ||
    text.includes("second-hand") ||
    text.includes("second hand")
  ) {
    add({
      label: "Vinted",
      href: "https://www.vinted.com/",
      reason: "Check second-hand clothing before buying new.",
    });
    add({
      label: "Tutti.ch",
      href: "https://www.tutti.ch/",
      reason: "Find local used items in Switzerland.",
    });
  }

  if (text.includes("repair") || text.includes("fix")) {
    add({
      label: "Repair Cafe Lausanne",
      href: "https://www.repaircafe-lausanne.ch/",
      reason: "Local repair events can extend product life and avoid replacement emissions.",
    });
  }

  if (
    text.includes("season") ||
    text.includes("pepper") ||
    text.includes("vegetable") ||
    text.includes("food") ||
    text.includes("beef")
  ) {
    add({
      label: "WWF seasonal guide",
      href: "https://www.wwf.ch/fr/guide-fruits-et-legumes",
      reason:
        "Seasonality matters because heated greenhouse or air-freighted produce can raise impact.",
    });
  }

  if (text.includes("footprint") || text.includes("this week") || text.includes("action")) {
    add({
      label: "UN ActNow",
      href: "https://www.un.org/en/actnow",
      reason: "A practical action library for everyday climate choices.",
    });
  }

  return links.slice(0, 4);
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
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
    </Tooltip>
  );
}

function Row({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-secondary/60 p-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-foreground">{text}</p>
      </div>
    </div>
  );
}
