import "./lib/error-capture";

import { carbonKnowledgeForKimi } from "./lib/carbon/kimiKnowledge";
import { productKnowledgeForMessage } from "./lib/carbon/productSearch";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import type {
  CarbonProfile,
  Confidence,
  ConnectedSource,
  HeatingType,
  PersonalGoal,
  SeasonalLocalHabit,
  Willingness,
} from "./lib/carbon/types";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type RuntimeEnv = {
  MOONSHOT_API_KEY?: string;
  KIMI_API_KEY?: string;
  KIMI_MODEL?: string;
  KIMI_BASE_URL?: string;
};

type KimiAdvisorPayload = {
  message?: string;
  profile?: unknown;
  localAdvice?: {
    diagnosis?: string;
    whyNow?: string;
    swap?: string;
    reductionKg?: number;
    confidence?: "low" | "medium" | "high";
    routed?: unknown;
  };
};

type KimiProfilePayload = {
  prompt?: string;
  currentProfile?: Partial<CarbonProfile>;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function apiKeyFrom(env: unknown): string | undefined {
  const runtimeEnv = ((env ?? {}) as RuntimeEnv) ?? {};
  const metaEnv = ((import.meta as unknown as { env?: RuntimeEnv }).env ?? {}) as RuntimeEnv;
  return (
    runtimeEnv.MOONSHOT_API_KEY ??
    runtimeEnv.KIMI_API_KEY ??
    metaEnv.MOONSHOT_API_KEY ??
    metaEnv.KIMI_API_KEY ??
    process.env.MOONSHOT_API_KEY ??
    process.env.KIMI_API_KEY
  );
}

function modelFrom(env: unknown): string {
  const runtimeEnv = ((env ?? {}) as RuntimeEnv) ?? {};
  const metaEnv = ((import.meta as unknown as { env?: RuntimeEnv }).env ?? {}) as RuntimeEnv;
  return runtimeEnv.KIMI_MODEL ?? metaEnv.KIMI_MODEL ?? process.env.KIMI_MODEL ?? "kimi-k2.6";
}

function kimiBaseUrlFrom(env: unknown): string {
  const runtimeEnv = ((env ?? {}) as RuntimeEnv) ?? {};
  const metaEnv = ((import.meta as unknown as { env?: RuntimeEnv }).env ?? {}) as RuntimeEnv;
  const baseUrl =
    runtimeEnv.KIMI_BASE_URL ??
    metaEnv.KIMI_BASE_URL ??
    process.env.KIMI_BASE_URL ??
    "https://api.moonshot.ai/v1";

  return baseUrl.replace(/\/$/, "");
}

function parseKimiJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function asWillingness(value: unknown, fallback: Willingness): Willingness {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

function asConfidence(value: unknown): Confidence {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function asHeatingType(value: unknown, fallback: HeatingType): HeatingType {
  return value === "unknown" ||
    value === "district" ||
    value === "heat_pump" ||
    value === "gas" ||
    value === "oil" ||
    value === "electric"
    ? value
    : fallback;
}

function asSeasonalLocalHabit(value: unknown, fallback: SeasonalLocalHabit): SeasonalLocalHabit {
  return value === "rarely" || value === "sometimes" || value === "often" ? value : fallback;
}

function filterStringUnion<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  return Array.isArray(value) ? value.filter((item): item is T => allowed.includes(item as T)) : [];
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed * 10) / 10));
}

function normalizeProfile(raw: Partial<CarbonProfile> | undefined): CarbonProfile {
  const fallback: CarbonProfile = {
    country: "CH",
    region: "Vaud",
    city: "Lausanne",
    beefMealsPerWeek: 0,
    otherMeatMealsPerWeek: 0,
    vegetarianMealsPerWeek: 14,
    carKmPerWeek: 0,
    trainKmPerWeek: 0,
    flightsPerYear: 0,
    newClothesPerMonth: 0,
    secondHandSharePct: 0,
    homeSizeM2: 70,
    householdSize: 2,
    heatingType: "unknown",
    showerMinutesPerDay: 8,
    seasonalLocalFood: "sometimes",
    personalGoals: ["reduce_emissions"],
    connectedSources: [],
    budgetSensitivity: "medium",
    willingnessDiet: "medium",
    willingnessTravel: "medium",
  };
  const profile = raw ?? {};

  return {
    country:
      typeof profile.country === "string" && profile.country ? profile.country : fallback.country,
    region: typeof profile.region === "string" ? profile.region : fallback.region,
    city: typeof profile.city === "string" ? profile.city : fallback.city,
    beefMealsPerWeek: boundedNumber(profile.beefMealsPerWeek, fallback.beefMealsPerWeek, 0, 200),
    otherMeatMealsPerWeek: boundedNumber(
      profile.otherMeatMealsPerWeek,
      fallback.otherMeatMealsPerWeek,
      0,
      200,
    ),
    vegetarianMealsPerWeek: boundedNumber(
      profile.vegetarianMealsPerWeek,
      fallback.vegetarianMealsPerWeek,
      0,
      200,
    ),
    carKmPerWeek: boundedNumber(profile.carKmPerWeek, fallback.carKmPerWeek, 0, 2000),
    trainKmPerWeek: boundedNumber(profile.trainKmPerWeek, fallback.trainKmPerWeek, 0, 3000),
    flightsPerYear: boundedNumber(profile.flightsPerYear, fallback.flightsPerYear, 0, 50),
    newClothesPerMonth: boundedNumber(
      profile.newClothesPerMonth,
      fallback.newClothesPerMonth,
      0,
      30,
    ),
    secondHandSharePct: boundedNumber(
      profile.secondHandSharePct,
      fallback.secondHandSharePct,
      0,
      100,
    ),
    homeSizeM2: boundedNumber(profile.homeSizeM2, fallback.homeSizeM2, 15, 300),
    householdSize: boundedNumber(profile.householdSize, fallback.householdSize, 1, 8),
    heatingType: asHeatingType(profile.heatingType, fallback.heatingType),
    showerMinutesPerDay: boundedNumber(
      profile.showerMinutesPerDay,
      fallback.showerMinutesPerDay,
      0,
      60,
    ),
    seasonalLocalFood: asSeasonalLocalHabit(profile.seasonalLocalFood, fallback.seasonalLocalFood),
    personalGoals: filterStringUnion<PersonalGoal>(profile.personalGoals, [
      "save_money",
      "reduce_emissions",
      "convenience",
      "health",
      "local_community",
    ]),
    connectedSources: filterStringUnion<ConnectedSource>(profile.connectedSources, [
      "grocery_receipts",
      "calendar_travel",
      "shopping_history",
    ]),
    budgetSensitivity: asWillingness(profile.budgetSensitivity, fallback.budgetSensitivity),
    willingnessDiet: asWillingness(profile.willingnessDiet, fallback.willingnessDiet),
    willingnessTravel: asWillingness(profile.willingnessTravel, fallback.willingnessTravel),
  };
}

async function kimiJsonCompletion(
  env: unknown,
  system: string,
  userPayload: unknown,
  maxTokens = 1200,
  timeoutMs = 25000,
): Promise<unknown | Response> {
  const apiKey = apiKeyFrom(env);
  if (!apiKey) {
    return jsonResponse({ error: "Missing MOONSHOT_API_KEY or KIMI_API_KEY" }, 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const completion = await fetch(`${kimiBaseUrlFrom(env)}/chat/completions`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelFrom(env),
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      thinking: { type: "disabled" },
    }),
  }).catch((error) => {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonResponse({ error: "Kimi request timed out. Please try again." }, 504);
    }
    return jsonResponse({ error: "Kimi request failed before a response was received." }, 502);
  });

  clearTimeout(timeout);

  if (
    completion instanceof Response &&
    completion.headers.get("content-type")?.includes("application/json")
  ) {
    const clone = completion.clone();
    try {
      const maybeError = (await clone.json()) as { error?: string };
      if (maybeError.error && completion.status >= 400) return completion;
    } catch {
      // Non-JSON failures are handled by the status branch below.
    }
  }

  if (!completion.ok) {
    const errorText = await completion.text();
    let errorMessage = `Kimi request failed with HTTP ${completion.status}`;
    try {
      const errorJson = JSON.parse(errorText) as { error?: { message?: string }; message?: string };
      errorMessage = errorJson.error?.message ?? errorJson.message ?? errorMessage;
    } catch {
      if (errorText) errorMessage = errorText.slice(0, 240);
    }
    return jsonResponse({ error: errorMessage }, completion.status);
  }

  const data = (await completion.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return jsonResponse({ error: "Kimi returned no content" }, 502);
  }

  try {
    return parseKimiJson(content);
  } catch {
    return jsonResponse({ error: "Kimi returned invalid JSON" }, 502);
  }
}

async function kimiAdvisorResponse(request: Request, env: unknown): Promise<Response> {
  let payload: KimiAdvisorPayload;
  try {
    payload = (await request.json()) as KimiAdvisorPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.message || !payload.localAdvice) {
    return jsonResponse({ error: "Missing message or localAdvice" }, 400);
  }

  const parsed = await kimiJsonCompletion(
    env,
    "You are a carbon footprint advisor for Lausanne, Vaud, Switzerland. Return only strict JSON with keys diagnosis, whyNow, swap, reductionKg, confidence. Use the bundled JSON carbon knowledge and deterministic local carbon result as the numeric source of truth. You may improve wording, classify vague foods/products, and reason about seasonality from the JSON files, but do not invent exact emissions data.",
    {
      userMessage: payload.message,
      savedProfile: payload.profile,
      deterministicAdvice: payload.localAdvice,
      bundledCarbonKnowledge: carbonKnowledgeForKimi(),
      retrievedProductKnowledge: productKnowledgeForMessage(payload.message),
    },
  );

  return parsed instanceof Response ? parsed : jsonResponse(parsed);
}

async function kimiProfileResponse(request: Request, env: unknown): Promise<Response> {
  let payload: KimiProfilePayload;
  try {
    payload = (await request.json()) as KimiProfilePayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.prompt) {
    return jsonResponse({ error: "Missing profile prompt" }, 400);
  }

  const currentProfile = normalizeProfile(payload.currentProfile);
  const parsed = await kimiJsonCompletion(
    env,
    "You convert a user's natural-language lifestyle description into a carbon profile. Return only strict JSON with keys profile, assumptions, confidence. The profile must contain exactly: country, region, city, beefMealsPerWeek, otherMeatMealsPerWeek, vegetarianMealsPerWeek, carKmPerWeek, trainKmPerWeek, flightsPerYear, newClothesPerMonth, secondHandSharePct, homeSizeM2, householdSize, heatingType, showerMinutesPerDay, seasonalLocalFood, personalGoals, connectedSources, budgetSensitivity, willingnessDiet, willingnessTravel. Use numbers, not strings, for numeric fields. heatingType must be one of unknown, district, heat_pump, gas, oil, electric. seasonalLocalFood must be rarely, sometimes, or often. personalGoals can include save_money, reduce_emissions, convenience, health, local_community. connectedSources can include grocery_receipts, calendar_travel, shopping_history. Convert daily habits into weekly totals exactly: if the user says 12 beef meals per day, beefMealsPerWeek must be 84. Do not cap meal counts to a normal diet; preserve unusual extreme inputs so the user can correct them. Use low, medium, or high for willingness fields. If unspecified, preserve currentProfile values or use Lausanne/Vaud/CH defaults. Be conservative and put uncertainty in assumptions.",
    {
      userDescription: payload.prompt,
      currentProfile,
      bundledCarbonKnowledge: carbonKnowledgeForKimi(),
      retrievedProductKnowledge: productKnowledgeForMessage(payload.prompt),
    },
    1000,
  );

  if (parsed instanceof Response) return parsed;

  const fields = parsed as {
    profile?: Partial<CarbonProfile>;
    assumptions?: unknown;
    confidence?: unknown;
  };

  return jsonResponse({
    profile: normalizeProfile({ ...currentProfile, ...fields.profile }),
    assumptions: Array.isArray(fields.assumptions)
      ? fields.assumptions.filter((item): item is string => typeof item === "string").slice(0, 6)
      : [],
    confidence: asConfidence(fields.confidence),
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/kimi-advisor" && request.method === "POST") {
        return await kimiAdvisorResponse(request, env);
      }
      if (url.pathname === "/api/kimi-profile" && request.method === "POST") {
        return await kimiProfileResponse(request, env);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
