import { routeUserMessage } from "./agentRouter";
import type { CarbonProfile, RoutedMessageResult } from "./types";

export interface AdvisorResponse {
  diagnosis: string;
  whyNow: string;
  swap: string;
  reductionKg: number;
  confidence: "low" | "medium" | "high";
  routed: RoutedMessageResult;
  source?: "local" | "kimi";
  kimiError?: string;
}

export function advise(prompt: string, profile: CarbonProfile | null): AdvisorResponse {
  const fallbackProfile: CarbonProfile = profile ?? {
    country: "CH",
    region: "Vaud",
    city: "Lausanne",
    beefMealsPerWeek: 3,
    otherMeatMealsPerWeek: 4,
    vegetarianMealsPerWeek: 14,
    carKmPerWeek: 120,
    trainKmPerWeek: 60,
    flightsPerYear: 2,
    newClothesPerMonth: 2,
    secondHandSharePct: 20,
    homeSizeM2: 75,
    householdSize: 2,
    heatingType: "district",
    showerMinutesPerDay: 8,
    seasonalLocalFood: "sometimes",
    personalGoals: ["reduce_emissions", "save_money"],
    connectedSources: ["calendar_travel"],
    budgetSensitivity: "medium",
    willingnessDiet: "medium",
    willingnessTravel: "high",
  };

  const routed = routeUserMessage(prompt, fallbackProfile);
  const response = routed.response;

  if (response.type === "food") {
    return {
      diagnosis: response.diagnosis,
      whyNow: response.whyNow,
      swap: response.recommendation,
      reductionKg: response.estimatedReductionKgCO2e,
      confidence: response.confidence,
      routed,
    };
  }

  if (response.type === "travel") {
    return {
      diagnosis: `${response.origin} to ${response.destination}: train ${response.modes[0].kgCO2ePerPassenger} kg CO2e per passenger vs car ${response.modes[1].kgCO2ePerPassenger} kg.`,
      whyNow:
        response.modes.find((mode) => mode.mode === response.bestMode)?.notes ??
        "This is based on stored local route data.",
      swap: response.recommendation,
      reductionKg: response.estimatedReductionKgCO2e,
      confidence: response.confidence,
      routed,
    };
  }

  if (response.type === "shopping") {
    return {
      diagnosis: response.diagnosis,
      whyNow:
        "Clothing production emissions happen before the item reaches the shop, so reuse and durability matter most.",
      swap: response.recommendation,
      reductionKg: response.estimatedReductionKgCO2e,
      confidence: response.confidence,
      routed,
    };
  }

  if (response.type === "actions") {
    const top = response.actions[0];
    return {
      diagnosis:
        "Your best weekly reductions come from the categories where your profile is above the local baseline.",
      whyNow: `${response.location} actions are ranked by your profile and estimated weekly savings.`,
      swap: top ? `${top.title}: ${top.description}` : "No local action matched this profile.",
      reductionKg: top?.estimatedKgCO2eSaved ?? 0,
      confidence: "high",
      routed,
    };
  }

  return {
    diagnosis: response.diagnosis,
    whyNow: "The deterministic router only handles food, travel, shopping, and action questions.",
    swap: response.recommendation,
    reductionKg: 0,
    confidence: "low",
    routed,
  };
}
