import actionsJson from "../../../data/local_actions_ch.json";
import type { ActionRecommendation, ActionRecommendationResult, CarbonProfile } from "./types";

const actions = actionsJson as Omit<ActionRecommendation, "reason">[];

function locationLabel(profile: CarbonProfile): string {
  return [profile.city, profile.region, profile.country === "CH" ? "Switzerland" : profile.country]
    .filter(Boolean)
    .join(", ");
}

function reasonFor(action: Omit<ActionRecommendation, "reason">, profile: CarbonProfile): string {
  if (action.category === "food" && profile.beefMealsPerWeek >= 2)
    return "Your profile has beef meals above the low-impact range.";
  if (action.category === "travel" && profile.carKmPerWeek > 80)
    return "Your weekly car kilometres make mode shift a practical lever.";
  if (action.category === "shopping" && profile.newClothesPerMonth >= 1)
    return "Your clothing purchases create a recurring production footprint.";
  if (action.category === "home") return "This is a quick Swiss household action with low effort.";
  return "This is a locally relevant action for Lausanne and Vaud.";
}

function priority(action: Omit<ActionRecommendation, "reason">, profile: CarbonProfile): number {
  let score = action.estimatedKgCO2eSaved;
  if (action.category === "food") score += profile.beefMealsPerWeek * 4;
  if (action.category === "travel") score += profile.carKmPerWeek / 20;
  if (action.category === "shopping") score += profile.newClothesPerMonth * 5;
  if (action.effort === "low") score += 5;
  return score;
}

export function recommendActions(profile: CarbonProfile): ActionRecommendationResult {
  const ranked = actions
    .map((action) => ({
      ...action,
      reason: reasonFor(action, profile),
      priority: priority(action, profile),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map(({ priority, ...action }) => action);

  return {
    type: "actions",
    title: "Recommended actions for this week",
    location: locationLabel(profile),
    totalPotentialKgCO2e: ranked.reduce((sum, action) => sum + action.estimatedKgCO2eSaved, 0),
    actions: ranked,
  };
}
