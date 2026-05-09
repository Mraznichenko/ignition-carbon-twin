export type Willingness = "low" | "medium" | "high";
export type HeatingType = "unknown" | "district" | "heat_pump" | "gas" | "oil" | "electric";
export type SeasonalLocalHabit = "rarely" | "sometimes" | "often";
export type PersonalGoal =
  | "save_money"
  | "reduce_emissions"
  | "convenience"
  | "health"
  | "local_community";
export type ConnectedSource = "grocery_receipts" | "calendar_travel" | "shopping_history";
export type CarbonCategory = "food" | "travel" | "shopping" | "home";
export type Confidence = "low" | "medium" | "high";
export type RouteIntent = "food" | "travel" | "shopping" | "actions" | "unknown";

export interface CarbonProfile {
  country: string;
  region: string;
  city: string;
  beefMealsPerWeek: number;
  otherMeatMealsPerWeek: number;
  vegetarianMealsPerWeek: number;
  carKmPerWeek: number;
  trainKmPerWeek: number;
  flightsPerYear: number;
  newClothesPerMonth: number;
  secondHandSharePct: number;
  homeSizeM2: number;
  householdSize: number;
  heatingType: HeatingType;
  showerMinutesPerDay: number;
  seasonalLocalFood: SeasonalLocalHabit;
  personalGoals: PersonalGoal[];
  connectedSources: ConnectedSource[];
  budgetSensitivity: Willingness;
  willingnessDiet: Willingness;
  willingnessTravel: Willingness;
}

export interface FootprintBreakdown {
  food: number;
  travel: number;
  shopping: number;
  home: number;
  total: number;
}

export interface FootprintCategory {
  category: CarbonCategory;
  label: string;
  annualKgCO2e: number;
  sharePct: number;
}

export interface FootprintResult extends FootprintBreakdown {
  unit: "kgCO2e/year";
  score: "A" | "B" | "C" | "D" | "E";
  percentile: number;
  regionalAverageKgCO2e: number;
  categories: FootprintCategory[];
  insights: string[];
}

export interface FoodAdviceInput {
  message: string;
  month: number;
  profile?: CarbonProfile | null;
}

export interface FoodAdviceResult {
  type: "food";
  title: string;
  diagnosis: string;
  whyNow: string;
  recommendation: string;
  estimatedMealKgCO2e: number;
  estimatedReductionKgCO2e: number;
  ingredientsDetected: string[];
  swaps: AdviceSwap[];
  confidence: Confidence;
}

export interface TravelAdviceInput {
  origin: string;
  destination: string;
  passengers?: number;
}

export interface TravelModeResult {
  mode: "train" | "car";
  kgCO2e: number;
  kgCO2ePerPassenger: number;
  durationMinutes: number;
  notes: string;
}

export interface TravelAdviceResult {
  type: "travel";
  title: string;
  origin: string;
  destination: string;
  passengers: number;
  distanceKmOneWay: number;
  roundTrip: boolean;
  modes: TravelModeResult[];
  bestMode: "train" | "car";
  estimatedReductionKgCO2e: number;
  recommendation: string;
  confidence: Confidence;
}

export interface ShoppingAdviceInput {
  message: string;
  profile?: CarbonProfile | null;
}

export interface ShoppingAdviceResult {
  type: "shopping";
  title: string;
  item: string;
  diagnosis: string;
  recommendation: string;
  newItemKgCO2e: number;
  estimatedReductionKgCO2e: number;
  options: AdviceSwap[];
  confidence: Confidence;
}

export interface ActionRecommendation {
  id: string;
  title: string;
  category: CarbonCategory;
  location: string;
  effort: Willingness;
  estimatedKgCO2eSaved: number;
  timeframe: string;
  description: string;
  reason: string;
}

export interface ActionRecommendationResult {
  type: "actions";
  title: string;
  location: string;
  totalPotentialKgCO2e: number;
  actions: ActionRecommendation[];
}

export interface AdviceSwap {
  label: string;
  detail: string;
  estimatedKgCO2eSaved: number;
}

export interface RoutedMessageResult {
  intent: RouteIntent;
  response:
    | FoodAdviceResult
    | TravelAdviceResult
    | ShoppingAdviceResult
    | ActionRecommendationResult
    | UnknownAdviceResult;
}

export interface UnknownAdviceResult {
  type: "unknown";
  title: string;
  diagnosis: string;
  recommendation: string;
  confidence: "low";
}

export interface ProfileInferenceResult {
  profile: CarbonProfile;
  assumptions: string[];
  confidence: Confidence;
}
