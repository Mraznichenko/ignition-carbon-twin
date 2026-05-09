import type { AdvisorResponse } from "./advisor";
import type { CarbonProfile } from "./types";

export interface KimiAdvisorRequest {
  message: string;
  profile: CarbonProfile | null;
  localAdvice: AdvisorResponse;
}

export async function askKimiAdvisor(request: KimiAdvisorRequest): Promise<AdvisorResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("/api/kimi-advisor", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => ({}))) as { error?: string };
      return {
        ...request.localAdvice,
        kimiError: errorPayload.error ?? `Kimi request failed with HTTP ${response.status}`,
      };
    }

    const payload = (await response.json()) as Partial<AdvisorResponse>;
    if (!payload.diagnosis || !payload.whyNow || !payload.swap) {
      return {
        ...request.localAdvice,
        kimiError: "Kimi response was missing required advisor fields.",
      };
    }

    return {
      diagnosis: payload.diagnosis,
      whyNow: payload.whyNow,
      swap: payload.swap,
      reductionKg: Number(payload.reductionKg ?? request.localAdvice.reductionKg),
      confidence: payload.confidence ?? request.localAdvice.confidence,
      routed: request.localAdvice.routed,
      source: "kimi",
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ...request.localAdvice,
      kimiError:
        error instanceof Error && error.name === "AbortError"
          ? "Kimi took too long to respond."
          : "Could not reach the local Kimi advisor endpoint.",
    };
  }
}
