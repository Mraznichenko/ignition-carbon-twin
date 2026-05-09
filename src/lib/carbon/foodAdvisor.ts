import emissionsJson from "../../../data/food_emissions.json";
import seasonalityJson from "../../../data/food_seasonality_ch.json";
import type { FoodAdviceInput, FoodAdviceResult } from "./types";

type EmissionRecord = { label: string; kgCO2ePerServing: number; category: string };
type SeasonRecord = {
  label: string;
  inSeasonMonths: number[];
  shoulderMonths?: number[];
  winterAlternatives?: string[];
};

const emissions = emissionsJson as Record<string, EmissionRecord>;
const seasonality = seasonalityJson as Record<string, SeasonRecord>;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function includesAny(message: string, words: string[]): boolean {
  return words.some((word) => message.includes(word));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function seasonalPepperKey(month: number): "bell_pepper_local_season" | "bell_pepper_winter" {
  const pepper = seasonality.bell_pepper;
  return pepper.inSeasonMonths.includes(month) || pepper.shoulderMonths?.includes(month)
    ? "bell_pepper_local_season"
    : "bell_pepper_winter";
}

function detectIngredient(q: string): keyof typeof emissions | null {
  if (includesAny(q, ["beef", "steak", "burger"])) return "beef";
  if (includesAny(q, ["chicken", "poultry"])) return "chicken";
  if (includesAny(q, ["tofu"])) return "tofu";
  if (includesAny(q, ["lentil", "lentils"])) return "lentils";
  if (includesAny(q, ["leek", "leeks"])) return "leek";
  if (includesAny(q, ["cabbage"])) return "cabbage";
  if (includesAny(q, ["squash", "pumpkin"])) return "squash";
  return null;
}

export function adviseFood({ message, month, profile }: FoodAdviceInput): FoodAdviceResult {
  const q = message.toLowerCase();
  const normalizedMonth = Math.min(12, Math.max(1, Math.round(month)));
  const ingredients: string[] = [];
  const hasBeef = includesAny(q, ["beef", "steak", "burger"]);
  const hasPepper = includesAny(q, ["bell pepper", "bell peppers", "pepper", "peppers"]);
  const detectedIngredient = detectIngredient(q);

  if (hasBeef) ingredients.push("beef");
  if (hasPepper) ingredients.push("bell pepper");
  if (
    detectedIngredient &&
    !ingredients.includes(emissions[detectedIngredient].label.toLowerCase())
  ) {
    ingredients.push(emissions[detectedIngredient].label.toLowerCase());
  }

  const pepperKey = seasonalPepperKey(normalizedMonth);
  const beefKg = hasBeef ? emissions.beef.kgCO2ePerServing : 0;
  const pepperKg = hasPepper ? emissions[pepperKey].kgCO2ePerServing : 0;
  const detectedKg =
    detectedIngredient && detectedIngredient !== "beef"
      ? emissions[detectedIngredient].kgCO2ePerServing
      : 0;
  const estimatedMeal = beefKg + pepperKg + detectedKg;
  const proteinSwap = hasBeef ? emissions.chicken.kgCO2ePerServing + pepperKg : estimatedMeal;
  const plantSwap = hasBeef ? emissions.lentils.kgCO2ePerServing + pepperKg : estimatedMeal;
  const seasonalVegKg = emissions.leek.kgCO2ePerServing;
  const seasonalSwap = hasPepper ? beefKg + seasonalVegKg : estimatedMeal;

  const pepperInSeason = pepperKey === "bell_pepper_local_season";
  const monthName = monthNames[normalizedMonth - 1];
  const location = profile?.city || "Lausanne";
  const weeklyBeef = profile?.beefMealsPerWeek ?? 0;
  const frequentBeef = weeklyBeef >= 3;
  const detectedLabel = detectedIngredient ? emissions[detectedIngredient].label.toLowerCase() : "";

  return {
    type: "food",
    title: hasBeef || hasPepper ? "Dinner carbon check" : "Food carbon check",
    diagnosis:
      hasBeef && hasPepper
        ? `Beef with bell peppers is estimated at ${round(estimatedMeal)} kg CO2e per serving in ${location}.`
        : hasBeef
          ? `Beef is the main driver here: about ${round(emissions.beef.kgCO2ePerServing)} kg CO2e per serving before sides in ${location}.`
          : detectedIngredient
            ? `${emissions[detectedIngredient].label} is estimated at about ${round(estimatedMeal)} kg CO2e per serving before full recipe details.`
            : frequentBeef
              ? `Your profile has ${weeklyBeef} beef meals per week, so food advice should focus on repeated protein habits rather than one ingredient.`
              : "I found a food question, but only partial ingredient detail. The result is based on your food habits and any detected ingredients.",
    whyNow: hasPepper
      ? pepperInSeason
        ? `${monthName} is within or close to Swiss bell pepper season, so beef dominates the footprint.`
        : `${monthName} is outside Swiss bell pepper season, so peppers are more likely greenhouse-grown or imported.`
      : hasBeef
        ? frequentBeef
          ? `Because you already log ${weeklyBeef} beef meals per week, even one regular swap can compound over the year.`
          : "Protein choice usually dominates a meal's footprint; sides matter, but less than beef."
        : detectedIngredient
          ? `${detectedLabel} is not the highest-impact part of most diets; the bigger lever is your repeated meat and shopping pattern.`
          : "Seasonality matters most for fresh produce; protein choice usually dominates the meal.",
    recommendation: hasBeef
      ? hasPepper && pepperInSeason
        ? "Keep the peppers and reduce the beef portion, or replace beef with chicken, tofu, or lentils."
        : "Reduce the beef portion or swap it for chicken, tofu, or lentils; choose seasonal Vaud vegetables for the sides."
      : detectedIngredient
        ? "Keep the meal, and focus your biggest reductions on frequent beef meals, car trips, flights, or new clothing purchases."
        : "Use seasonal Swiss vegetables and keep high-impact proteins as the first thing to adjust.",
    estimatedMealKgCO2e: round(estimatedMeal),
    estimatedReductionKgCO2e: round(
      Math.max(estimatedMeal - Math.min(proteinSwap, plantSwap, seasonalSwap), 0),
    ),
    ingredientsDetected: ingredients,
    swaps: [
      {
        label: "Chicken instead of beef",
        detail: "Keeps a similar cooking style with a much lower protein footprint.",
        estimatedKgCO2eSaved: round(Math.max(estimatedMeal - proteinSwap, 0)),
      },
      {
        label: "Lentils or tofu instead of beef",
        detail: "Best climate reduction while keeping a hearty dish.",
        estimatedKgCO2eSaved: round(Math.max(estimatedMeal - plantSwap, 0)),
      },
      {
        label: "Seasonal Swiss vegetables",
        detail: "Use leek, cabbage, or squash when peppers are out of season.",
        estimatedKgCO2eSaved: round(Math.max(estimatedMeal - seasonalSwap, 0)),
      },
    ].filter((swap) => swap.estimatedKgCO2eSaved > 0),
    confidence: hasBeef || hasPepper ? "high" : "medium",
  };
}
