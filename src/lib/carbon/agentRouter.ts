import type { CarbonProfile, RoutedMessageResult, RouteIntent } from "./types";
import { recommendActions } from "./actionRecommender";
import { adviseFood } from "./foodAdvisor";
import { adviseShopping } from "./shoppingAdvisor";
import { compareTravel } from "./travelAdvisor";

const DEFAULT_DEMO_MONTH = 5;

function detectIntent(message: string): RouteIntent {
  const q = message.toLowerCase();
  if (
    ["cook", "eat", "meal", "beef", "pepper", "dinner", "tonight"].some((term) => q.includes(term))
  )
    return "food";
  if (["train", "car", "milan", "route", "travel", "drive"].some((term) => q.includes(term)))
    return "travel";
  if (["buy", "jacket", "clothes", "shopping", "purchase"].some((term) => q.includes(term)))
    return "shopping";
  if (["reduce", "footprint", "this week", "action", "how can i"].some((term) => q.includes(term)))
    return "actions";
  return "unknown";
}

function routeLocations(
  message: string,
  profile: CarbonProfile,
): { origin: string; destination: string } {
  const q = message.toLowerCase();
  const origin = q.includes("lausanne") ? "Lausanne" : profile.city || "Lausanne";
  const destination = q.includes("milan") ? "Milan" : "Milan";
  return { origin, destination };
}

export function routeUserMessage(message: string, profile: CarbonProfile): RoutedMessageResult {
  const intent = detectIntent(message);

  if (intent === "food") {
    return { intent, response: adviseFood({ message, month: DEFAULT_DEMO_MONTH, profile }) };
  }

  if (intent === "travel") {
    const { origin, destination } = routeLocations(message, profile);
    return { intent, response: compareTravel({ origin, destination, passengers: 1 }) };
  }

  if (intent === "shopping") {
    return { intent, response: adviseShopping({ message, profile }) };
  }

  if (intent === "actions") {
    return { intent, response: recommendActions(profile) };
  }

  return {
    intent: "unknown",
    response: {
      type: "unknown",
      title: "I need a more specific carbon question",
      diagnosis:
        "I could not confidently classify this as food, travel, shopping, or weekly actions.",
      recommendation:
        "Ask about a meal, route, purchase, or how to reduce your footprint this week.",
      confidence: "low",
    },
  };
}
