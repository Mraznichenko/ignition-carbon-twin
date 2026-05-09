import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Leaf,
  Lock,
  Network,
  Sparkles,
  Zap,
} from "lucide-react";
import companyDemo from "../../data/company_demo.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Carbon Twin for Work" },
      {
        name: "description",
        content:
          "AI carbon coaching, aggregated company insights, and ESRS-style reporting support.",
      },
    ],
  }),
  component: CompanyPage,
});

type Campaign = (typeof companyDemo.campaigns)[number];
type Partner = (typeof companyDemo.partners)[number];

const esrsSummary = `AlpineTech SA has onboarded 186 of 420 employees into Carbon Twin. Based on employee lifestyle inputs and company-level assumptions, the largest behavior-linked emissions categories are commuting, business travel, meals and catering, procurement, and remote-work energy.

Carbon Twin identified three near-term reduction campaigns:
1. Train-first business travel
2. Seasonal canteen and catering choices
3. Repair-before-replacement procurement

Estimated potential annual reduction: 410 t CO2e.

This summary is designed to support internal ESG reporting, supplier sustainability questionnaires, employee engagement evidence, and ESRS-style climate transition narratives. In production, audited assurance and regulatory filing workflows can be added around this structured evidence layer.`;

function CompanyPage() {
  const { companyProfile, metrics, breakdown, campaigns, partners } = companyDemo;
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const onboardedPct = Math.round(
    (companyProfile.employeesOnboarded / companyProfile.employeesTotal) * 100,
  );

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(esrsSummary);
      setActionMessage("Summary copied to clipboard.");
    } catch {
      setActionMessage("Copy is unavailable in this browser, but the summary is visible here.");
    }
  };

  const evidencePack = `Carbon Twin ESG evidence pack

Company: ${companyProfile.name}
Location: ${companyProfile.location}
Employees onboarded: ${companyProfile.employeesOnboarded} / ${companyProfile.employeesTotal}
Estimated employee-linked footprint: ${metrics.estimatedEmployeeRelatedFootprintTons} t CO2e/year
Potential annual reduction identified: ${metrics.potentialAnnualReductionTons} t CO2e/year

Top anonymized categories:
${breakdown.map((item) => `- ${item.category}: ${item.tons} t CO2e/year (${item.percent}%)`).join("\n")}

Near-term campaigns:
${campaigns
  .slice(0, 3)
  .map(
    (campaign) =>
      `- ${campaign.title}: ${campaign.potentialReductionTons} t CO2e/year potential reduction`,
  )
  .join("\n")}

Positioning note:
Carbon Twin is a reporting-support and climate action intelligence layer. In production, audit, controls, evidence review, and filing workflows can be added around this structured evidence.`;

  const downloadPdfReport = async (variant: "summary" | "evidence") => {
    try {
      setActionMessage("Preparing PDF export...");
      const reportTitle =
        variant === "summary"
          ? "ESRS-style climate action summary"
          : "Carbon Twin ESG evidence pack";
      const reportBody = variant === "summary" ? esrsSummary : evidencePack;
      const pdfBlob = await createCompanyReportPdf({
        title: reportTitle,
        body: reportBody,
        companyName: companyProfile.name,
        metrics: [
          {
            label: "Employee-linked footprint",
            value: `${metrics.estimatedEmployeeRelatedFootprintTons.toLocaleString()} t CO2e/year`,
          },
          {
            label: "Potential annual reduction",
            value: `${metrics.potentialAnnualReductionTons} t CO2e/year`,
          },
          {
            label: "Employees onboarded",
            value: `${companyProfile.employeesOnboarded}/${companyProfile.employeesTotal}`,
          },
        ],
        breakdown: breakdown.map((item) => ({
          label: item.category,
          value: `${item.tons.toLocaleString()} t · ${item.percent}%`,
          percent: item.percent,
        })),
      });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        variant === "summary"
          ? "carbon-twin-esrs-style-summary.pdf"
          : "carbon-twin-evidence-pack.pdf";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setActionMessage("PDF export started.");
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      console.error(error);
      setActionMessage("PDF export failed. Please try again or use Copy summary.");
    }
  };

  const downloadSummary = () => {
    void downloadPdfReport("summary");
  };

  const downloadEvidencePack = () => {
    void downloadPdfReport("evidence");
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50/80 p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-medium text-teal-700">
            <Building2 className="h-3.5 w-3.5" />
            Carbon Twin for Work
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            AI carbon coaching and reporting-support for companies.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
            Turn employee, travel, food, procurement, and workplace behavior into aggregated carbon
            insights, reduction campaigns, and ESRS-style summaries.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSummaryOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm hover:opacity-90"
            >
              Generate ESRS-style summary <FileText className="h-4 w-4" />
            </button>
            <a
              href="#company-insights"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              View company insights <BarChart3 className="h-4 w-4" />
            </a>
            <Link
              to="/advisor"
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-medium text-teal-800 shadow-sm hover:bg-teal-100"
            >
              Open employee advisor <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={downloadEvidencePack}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Export PDF evidence pack <Download className="h-4 w-4" />
            </button>
          </div>
          {actionMessage ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-teal-800">
              <CheckCircle2 className="h-4 w-4" />
              {actionMessage}
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Company profile
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {companyProfile.name}
          </h2>
          <dl className="mt-5 grid gap-3 text-sm">
            <InfoRow label="Location" value={companyProfile.location} />
            <InfoRow label="Industry" value={companyProfile.industry} />
            <InfoRow
              label="Employees onboarded"
              value={`${companyProfile.employeesOnboarded} / ${companyProfile.employeesTotal}`}
            />
            <InfoRow label="Reporting context" value={companyProfile.reportingContext} />
            <InfoRow
              label="Reduction goal"
              value={`${companyProfile.annualReductionGoalPercent}% annual employee-linked reduction`}
            />
          </dl>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Many companies are not directly in scope of CSRD, but still face sustainability data
            requests from enterprise customers, investors, or procurement teams.
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 p-6 text-white shadow-sm lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              AI-detected insight
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              42% of AlpineTech’s travel emissions come from regional trips under 4 hours by rail.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              AI-assisted interpretation of deterministic, aggregated travel signals. Individual
              employee journeys and advisor chats remain private.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                Suggested intervention
              </p>
              <p className="mt-2 text-xl font-semibold">
                Launch a train-first policy for Lausanne-Paris and Lausanne-Milan routes.
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/10 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                Estimated reduction
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">82-110 t CO2e/year</p>
              <p className="mt-1 text-sm text-emerald-50/75">Projected reduction opportunity</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              How the work layer connects
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              From private twins to company insight
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Individual coaching stays private. Only anonymized category trends become useful for
            campaigns, partner workflows, and reporting-support summaries.
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            ["Employees", "Private carbon twins and advisor conversations"],
            ["Anonymized trends", "Category-level patterns across the workspace"],
            ["Campaigns", "Train-first travel, seasonal meals, repair-first procurement"],
            ["ESRS-style summary", "Internal ESG evidence and supplier questionnaire support"],
          ].map(([title, body], index) => (
            <div key={title} className="relative rounded-2xl bg-slate-50 p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="company-insights" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Estimated employee-linked footprint"
          value={metrics.estimatedEmployeeRelatedFootprintTons.toLocaleString()}
          unit="t CO2e/year"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          label="Potential annual reduction identified"
          value={metrics.potentialAnnualReductionTons.toString()}
          unit="t CO2e/year"
          icon={<Leaf className="h-4 w-4" />}
        />
        <MetricCard
          label="Employees onboarded"
          value={`${companyProfile.employeesOnboarded} / ${companyProfile.employeesTotal}`}
          unit={`${onboardedPct}% active twin coverage`}
          icon={<Network className="h-4 w-4" />}
        />
        <MetricCard
          label="Average carbon twin score"
          value={metrics.averageTwinScore}
          unit="aggregated employee signal"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Active campaigns"
          value={metrics.activeCampaigns.toString()}
          unit="live or ready to launch"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Aggregated footprint
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Behavior-level drivers
              </h2>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              anonymized
            </span>
          </div>
          <div className="mt-6 grid gap-4">
            {breakdown.map((item) => (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{item.category}</span>
                  <span className="text-slate-500">
                    {item.tons.toLocaleString()} t · {item.percent}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <CSRDSupportCard />
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Reporting roadmap
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Carbon Twin starts as a reporting-support layer for behavior-level climate evidence.
              The same structured data can later support audit controls, review workflows, and
              formal reporting integrations.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Recommended reduction campaigns
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Reduce first. Address residual emissions second.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Campaigns translate aggregated insights into interventions sustainability, HR, travel,
            and procurement teams can actually launch.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.title}
              campaign={campaign}
              onAction={() =>
                setActionMessage(
                  "This action opens the campaign setup or partner workflow in the full workspace.",
                )
              }
            />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
              Climate action marketplace
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Connect insights to action providers
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Real-world links for mobility, circular economy, procurement, residual carbon removal,
            and ESG reporting support.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {partners.map((partner) => (
            <PartnerCard key={partner.name} partner={partner} />
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <TrustCard
          icon={<Lock className="h-5 w-5" />}
          title="Employee privacy by design"
          body="Individual carbon twins remain private to employees. Company dashboards use aggregated and anonymized insights only. The goal is to identify reduction opportunities, not to rank or punish individuals."
        />
        <TrustCard
          icon={<Zap className="h-5 w-5" />}
          title="AI-conscious architecture"
          body="Carbon Twin uses deterministic local carbon tools as the source of truth. The AI layer is used only for parsing, explanation, and personalization. If the model is unavailable, the app still works with local fallback logic."
        />
      </section>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ESRS-style climate action summary</DialogTitle>
            <DialogDescription>
              Reporting-support draft for internal ESG, supplier questionnaires, and transition
              planning.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-auto whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {esrsSummary}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" />
              Copy summary
            </button>
            <button
              type="button"
              onClick={downloadSummary}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Generate PDF report
            </button>
            <button
              type="button"
              onClick={() => setSummaryOpen(false)}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

async function createCompanyReportPdf({
  title,
  body,
  companyName,
  metrics,
  breakdown,
}: {
  title: string;
  body: string;
  companyName: string;
  metrics: Array<{ label: string; value: string }>;
  breakdown: Array<{ label: string; value: string; percent: number }>;
}) {
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");

  const roundedRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: string | CanvasGradient,
    stroke?: string,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawLeafLogo = (x: number, y: number, size: number) => {
    roundedRect(x, y, size, size, size * 0.3, "#059669");
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(-0.55);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.2, size * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(3, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.32, y + size * 0.66);
    ctx.quadraticCurveTo(x + size * 0.48, y + size * 0.46, x + size * 0.67, y + size * 0.28);
    ctx.stroke();
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    color = "#0f172a",
    weight = 500,
  ) => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText(text, x, y);
  };

  const wrapText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    size: number,
    color = "#334155",
    weight = 400,
    maxLines = 28,
  ) => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    let cursorY = y;
    let lines = 0;

    text.split("\n").forEach((paragraph) => {
      if (lines >= maxLines) return;
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) {
        cursorY += lineHeight;
        lines += 1;
        return;
      }

      let line = "";
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          ctx.fillText(line, x, cursorY);
          cursorY += lineHeight;
          lines += 1;
          line = word;
        } else {
          line = next;
        }
      });
      if (line && lines < maxLines) {
        ctx.fillText(line, x, cursorY);
        cursorY += lineHeight;
        lines += 1;
      }
    });

    return cursorY;
  };

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(0.55, "#f0fdfa");
  bg.addColorStop(1, "#ecfdf5");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(16, 185, 129, 0.10)";
  ctx.beginPath();
  ctx.arc(1090, 130, 210, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(140, 1600, 260, 0, Math.PI * 2);
  ctx.fill();

  drawLeafLogo(84, 84, 72);
  drawText("Carbon Twin", 178, 130, 38, "#0f172a", 800);
  roundedRect(895, 97, 250, 42, 21, "#ffffff", "#99f6e4");
  drawText("Carbon Twin for Work", 926, 125, 18, "#047857", 700);

  ctx.strokeStyle = "#ccfbf1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(84, 190);
  ctx.lineTo(1156, 190);
  ctx.stroke();

  wrapText(title, 84, 275, 850, 54, 50, "#0f172a", 800, 2);
  wrapText(
    `Branded reporting-support export for ${companyName}. This report structures behavior-level climate evidence into decision-ready insights.`,
    84,
    390,
    900,
    34,
    25,
    "#475569",
    400,
    3,
  );

  const metricWidth = 330;
  metrics.forEach((metric, index) => {
    const x = 84 + index * (metricWidth + 30);
    roundedRect(x, 500, metricWidth, 132, 26, "rgba(255,255,255,0.86)", "#d1fae5");
    wrapText(metric.label, x + 28, 548, 250, 24, 18, "#64748b", 700, 2);
    drawText(metric.value, x + 28, 602, 30, "#0f172a", 800);
  });

  roundedRect(84, 690, 1072, 360, 32, "rgba(255,255,255,0.84)", "#d1fae5");
  drawText("SUMMARY", 116, 750, 22, "#047857", 800);
  const compactSummary =
    "AlpineTech SA onboarded 186 of 420 employees. Main behavior-linked emissions: commuting, business travel, meals and catering, procurement, and remote-work energy.\n\nNear-term campaigns: train-first business travel, seasonal catering, and repair-before-replacement procurement.\n\nEstimated potential annual reduction: 410 t CO2e. This evidence supports internal ESG, supplier questionnaires, employee engagement, and ESRS-style climate narratives.";
  wrapText(compactSummary, 116, 810, 1005, 30, 21, "#334155", 400, 12);

  roundedRect(84, 1095, 1072, 400, 32, "rgba(255,255,255,0.84)", "#d1fae5");
  drawText("CATEGORY DRIVERS", 116, 1155, 22, "#047857", 800);
  breakdown.forEach((item, index) => {
    const y = 1215 + index * 60;
    drawText(item.label, 116, y, 20, "#334155", 700);
    drawText(item.value, 850, y, 20, "#334155", 700);
    roundedRect(116, y + 18, 920, 18, 9, "#dcfce7");
    const bar = ctx.createLinearGradient(116, y + 18, 1036, y + 18);
    bar.addColorStop(0, "#14b8a6");
    bar.addColorStop(1, "#22c55e");
    roundedRect(116, y + 18, Math.max(42, (920 * item.percent) / 100), 18, 9, bar);
  });

  wrapText(
    "Carbon Twin is designed as a reporting-support and climate action intelligence layer. In production, audit, controls, evidence review, and filing workflows can be added around this structured evidence.",
    84,
    1605,
    940,
    26,
    18,
    "#64748b",
    400,
    3,
  );

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not render report image."));
      },
      "image/jpeg",
      0.94,
    );
  });
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  return buildImagePdf(jpegBytes, width, height);
}

function buildImagePdf(imageBytes: Uint8Array, imageWidth: number, imageHeight: number) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;

  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };

  const object = (id: number, content: string | Uint8Array, streamPrefix = "") => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    if (content instanceof Uint8Array) {
      push(streamPrefix);
      push(content);
      push("\nendstream\n");
    } else {
      push(content);
    }
    push("\nendobj\n");
  };

  push("%PDF-1.4\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>",
  );
  object(
    4,
    imageBytes,
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
  );
  const content = "q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ";
  object(5, `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);

  const xrefOffset = length;
  push("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i += 1) {
    push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdf = new Uint8Array(length);
  let cursor = 0;
  chunks.forEach((chunk) => {
    pdf.set(chunk, cursor);
    cursor += chunk.length;
  });

  return new Blob([pdf], { type: "application/pdf" });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{unit}</p>
    </div>
  );
}

function CSRDSupportCard() {
  const tags = [
    "Internal ESG",
    "Supplier questionnaires",
    "Employee engagement",
    "Climate action planning",
    "ESRS-style summaries",
  ];

  return (
    <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Reporting-support layer
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        CSRD / ESRS Support
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Carbon Twin helps sustainability teams collect and structure the behavior-level data behind
        climate action: commuting, business travel, meals, procurement, remote-work energy, and
        employee engagement. The reporting layer can evolve toward stronger evidence review,
        approval, and export workflows.
      </p>
      <p className="mt-4 text-sm font-medium text-slate-900">The output can support:</p>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
        <li>internal ESG dashboards</li>
        <li>supplier sustainability questionnaires</li>
        <li>employee engagement evidence</li>
        <li>climate transition planning</li>
        <li>ESRS-style climate narratives</li>
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-medium text-teal-800"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onAction }: { campaign: Campaign; onAction: () => void }) {
  return (
    <div className="flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            {campaign.category}
          </span>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
            {campaign.title}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-950">{campaign.potentialReductionTons}</p>
          <p className="text-xs text-slate-500">t CO2e/year</p>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{campaign.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
          Effort: {campaign.effort}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
          Confidence: {campaign.confidence}
        </span>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {campaign.cta}
      </button>
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="flex min-h-64 flex-col rounded-3xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur">
      <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-200">
        {partner.type}
      </span>
      <h3 className="mt-3 text-base font-semibold tracking-tight text-white">{partner.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{partner.description}</p>
      <a
        href={partner.url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-50"
      >
        {partner.action}
      </a>
    </div>
  );
}

function TrustCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
