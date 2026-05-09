import foodEmissions from "../../../data/food_emissions.json";
import foodSeasonalityCh from "../../../data/food_seasonality_ch.json";
import localActionsCh from "../../../data/local_actions_ch.json";
import regionalAverages from "../../../data/regional_averages.json";
import travelRoutes from "../../../data/travel_routes.json";

export function carbonKnowledgeForKimi() {
  return {
    scope:
      "Local deterministic carbon data bundled with the app. Prefer these records over general memory.",
    demoLocation: {
      city: "Lausanne",
      region: "Vaud",
      country: "Switzerland",
    },
    foodEmissions,
    foodSeasonalityCh,
    travelRoutes,
    regionalAverages,
    localActionsCh,
  };
}
