import type { CarbonProfile, ProfileInferenceResult } from "./types";

export async function inferProfileFromPrompt(
  prompt: string,
  currentProfile: CarbonProfile,
): Promise<ProfileInferenceResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch("/api/kimi-profile", {
    method: "POST",
    signal: controller.signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, currentProfile }),
  }).catch((error) => {
    clearTimeout(timeout);
    throw new Error(
      error instanceof Error && error.name === "AbortError"
        ? "Kimi took too long to fill the profile."
        : "Could not reach Kimi profile inference.",
    );
  });

  clearTimeout(timeout);

  const payload = (await response.json().catch(() => ({}))) as Partial<ProfileInferenceResult> & {
    error?: string;
  };

  if (!response.ok || !payload.profile) {
    throw new Error(payload.error ?? `Profile inference failed with HTTP ${response.status}`);
  }

  return {
    profile: payload.profile,
    assumptions: payload.assumptions ?? [],
    confidence: payload.confidence ?? "medium",
  };
}
