import regionalAverages from "../../../data/regional_averages.json";
import type {
  CarbonProfile,
  FootprintBreakdown,
  FootprintCategory,
  FootprintResult,
} from "./types";

const EF = {
  beefMeal: 7.5,
  otherMeatMeal: 2.2,
  vegMeal: 0.7,
  carKm: 0.18,
  trainKm: 0.035,
  flight: 850,
  newGarment: 22,
  showerMinute: 0.08,
};

const HEATING_MULTIPLIER: Record<CarbonProfile["heatingType"], number> = {
  unknown: 1,
  district: 0.85,
  heat_pump: 0.55,
  electric: 0.9,
  gas: 1.1,
  oil: 1.35,
};

type RegionalAverageRecord = {
  annualKgCO2ePerCapita: number;
  homeBaselineKgCO2e: number;
};

const averages = regionalAverages as Record<string, RegionalAverageRecord>;

function locationKey(profile: CarbonProfile): string {
  const country = profile.country || "DEFAULT";
  if (country.toUpperCase() === "CH" && profile.region && profile.city) {
    return `CH-${profile.region === "Vaud" ? "VD" : profile.region}-${profile.city}`;
  }
  if (country.toUpperCase() === "CH" && profile.region === "Vaud") return "CH-VD";
  return country.toUpperCase();
}

function regionalRecord(profileOrCountry: CarbonProfile | string): RegionalAverageRecord {
  if (typeof profileOrCountry === "string") {
    return averages[profileOrCountry.toUpperCase()] ?? averages.DEFAULT;
  }
  return (
    averages[locationKey(profileOrCountry)] ??
    averages[profileOrCountry.country.toUpperCase()] ??
    averages.DEFAULT
  );
}

export function regionalAverage(profileOrCountry: CarbonProfile | string): number {
  return regionalRecord(profileOrCountry).annualKgCO2ePerCapita;
}

export function scoreFootprint(total: number, average: number): "A" | "B" | "C" | "D" | "E" {
  const ratio = total / average;
  if (ratio < 0.5) return "A";
  if (ratio < 0.8) return "B";
  if (ratio < 1.1) return "C";
  if (ratio < 1.4) return "D";
  return "E";
}

export function percentile(total: number, average: number): number {
  const ratio = total / average;
  const pct = Math.round(100 - Math.min(100, Math.max(0, (ratio - 0.3) * 70)));
  return Math.max(1, Math.min(99, pct));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function bounded(value: number | undefined, fallback: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value as number)) : fallback;
}

function homeFootprint(profile: CarbonProfile): number {
  const baseline = regionalRecord(profile).homeBaselineKgCO2e;
  const homeSizeM2 = bounded(profile.homeSizeM2, 70, 15, 300);
  const householdSize = bounded(profile.householdSize, 2, 1, 8);
  const showerMinutesPerDay = bounded(profile.showerMinutesPerDay, 8, 0, 60);
  const heatingType = profile.heatingType ?? "unknown";
  const sizeFactor = homeSizeM2 / 70;
  const sharedHomeFactor = 1 / Math.sqrt(householdSize);
  const heating = baseline * 0.8 * HEATING_MULTIPLIER[heatingType] * sizeFactor * sharedHomeFactor;
  const hotWater = showerMinutesPerDay * 365 * EF.showerMinute;
  return heating + hotWater;
}

function categoryRows(breakdown: FootprintBreakdown): FootprintCategory[] {
  const rows: Array<[FootprintCategory["category"], string, number]> = [
    ["food", "Food", breakdown.food],
    ["travel", "Travel", breakdown.travel],
    ["shopping", "Shopping", breakdown.shopping],
    ["home", "Home", breakdown.home],
  ];

  return rows.map(([category, label, annualKgCO2e]) => ({
    category,
    label,
    annualKgCO2e: round(annualKgCO2e),
    sharePct: breakdown.total > 0 ? Math.round((annualKgCO2e / breakdown.total) * 100) : 0,
  }));
}

export function topInsights(profile: CarbonProfile, b: FootprintBreakdown): string[] {
  const insights: { score: number; text: string }[] = [];
  if (profile.flightsPerYear >= 2) {
    insights.push({
      score: profile.flightsPerYear * EF.flight,
      text: `Flights drive ${Math.round(((profile.flightsPerYear * EF.flight) / b.total) * 100)}% of your footprint. One fewer medium flight saves about ${EF.flight} kg CO2e.`,
    });
  }
  if (profile.beefMealsPerWeek >= 2) {
    insights.push({
      score: profile.beefMealsPerWeek * EF.beefMeal * 52,
      text: `Beef is a major food lever. Swapping 2 beef meals per week for poultry saves about ${Math.round((EF.beefMeal - EF.otherMeatMeal) * 2 * 52)} kg per year.`,
    });
  }
  if (profile.seasonalLocalFood === "rarely") {
    insights.push({
      score: profile.vegetarianMealsPerWeek * EF.vegMeal * 52,
      text: `Seasonality is a context lever in ${profile.region || profile.country}. Buying local seasonal produce more often helps avoid winter greenhouse or long-distance imports.`,
    });
  }
  if (profile.carKmPerWeek > 100) {
    insights.push({
      score: profile.carKmPerWeek * EF.carKm * 52,
      text: `You drive ${profile.carKmPerWeek} km per week. Moving 30% to train cuts about ${Math.round(profile.carKmPerWeek * 0.3 * (EF.carKm - EF.trainKm) * 52)} kg per year.`,
    });
  }
  if (profile.newClothesPerMonth >= 2 && profile.secondHandSharePct < 50) {
    insights.push({
      score: profile.newClothesPerMonth * 12 * EF.newGarment,
      text: `Raising second-hand share to 50% would save about ${Math.round(Math.max(0, 0.5 - profile.secondHandSharePct / 100) * profile.newClothesPerMonth * 12 * EF.newGarment)} kg per year.`,
    });
  }
  if (profile.heatingType === "oil" || profile.heatingType === "gas") {
    insights.push({
      score: b.home,
      text: `Home heating is a visible lever. Lowering heating by 1 degree or switching from ${profile.heatingType} can cut home energy emissions.`,
    });
  } else if (profile.showerMinutesPerDay > 12) {
    insights.push({
      score: profile.showerMinutesPerDay * 365 * EF.showerMinute,
      text: `Shortening showers from ${profile.showerMinutesPerDay} to 8 minutes saves about ${Math.round((profile.showerMinutesPerDay - 8) * 365 * EF.showerMinute)} kg per year.`,
    });
  }
  return insights
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((i) => i.text);
}

export function calculateFootprint(profile: CarbonProfile): FootprintResult {
  const food =
    (profile.beefMealsPerWeek * EF.beefMeal +
      profile.otherMeatMealsPerWeek * EF.otherMeatMeal +
      profile.vegetarianMealsPerWeek * EF.vegMeal) *
    52;

  const travel =
    profile.carKmPerWeek * EF.carKm * 52 +
    profile.trainKmPerWeek * EF.trainKm * 52 +
    profile.flightsPerYear * EF.flight;

  const effectiveNewClothes =
    profile.newClothesPerMonth * 12 * (1 - profile.secondHandSharePct / 100);
  const shopping = effectiveNewClothes * EF.newGarment;
  const home = homeFootprint(profile);
  const total = food + travel + shopping + home;
  const average = regionalAverage(profile);

  const breakdown: FootprintBreakdown = {
    food: round(food),
    travel: round(travel),
    shopping: round(shopping),
    home: round(home),
    total: round(total),
  };

  return {
    ...breakdown,
    unit: "kgCO2e/year",
    score: scoreFootprint(total, average),
    percentile: percentile(total, average),
    regionalAverageKgCO2e: average,
    categories: categoryRows(breakdown),
    insights: topInsights(profile, breakdown),
  };
}

export const DEMO_PROFILE: CarbonProfile = {
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

export const EMPTY_PROFILE: CarbonProfile = {
  country: "CH",
  region: "",
  city: "",
  beefMealsPerWeek: 0,
  otherMeatMealsPerWeek: 0,
  vegetarianMealsPerWeek: 0,
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
