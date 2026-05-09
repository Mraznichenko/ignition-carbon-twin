import type { ShoppingAdviceInput, ShoppingAdviceResult } from "./types";

const ITEM_FACTORS: Record<string, { label: string; kgCO2e: number; durableAlternative: string }> =
  {
    jacket: {
      label: "jacket",
      kgCO2e: 28,
      durableAlternative:
        "Choose second-hand, repaired, or a durable recycled/wool jacket you expect to keep for 5+ years.",
    },
    clothes: {
      label: "clothing item",
      kgCO2e: 22,
      durableAlternative:
        "Buy second-hand first, repair what you own, or choose one durable replacement.",
    },
  };

function detectItem(message: string): keyof typeof ITEM_FACTORS {
  const q = message.toLowerCase();
  if (q.includes("jacket") || q.includes("coat")) return "jacket";
  return "clothes";
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function adviseShopping({ message, profile }: ShoppingAdviceInput): ShoppingAdviceResult {
  const itemKey = detectItem(message);
  const item = ITEM_FACTORS[itemKey];
  const secondHandShare = profile?.secondHandSharePct ?? 0;
  const secondHandReduction = item.kgCO2e * 0.8;
  const repairReduction = item.kgCO2e * 0.95;
  const durableReduction = item.kgCO2e * 0.4;

  return {
    type: "shopping",
    title: `Buying a ${item.label}`,
    item: item.label,
    diagnosis: `A new ${item.label} is estimated at ${item.kgCO2e} kg CO2e. Most impact comes from materials and production, not delivery.`,
    recommendation:
      secondHandShare < 50
        ? `Try second-hand or repair first in Lausanne. ${item.durableAlternative}`
        : item.durableAlternative,
    newItemKgCO2e: item.kgCO2e,
    estimatedReductionKgCO2e: round(secondHandReduction),
    options: [
      {
        label: "Buy second-hand",
        detail: "Usually avoids most production emissions for a garment.",
        estimatedKgCO2eSaved: round(secondHandReduction),
      },
      {
        label: "Repair or alter",
        detail: "Best option if an existing jacket can still serve the need.",
        estimatedKgCO2eSaved: round(repairReduction),
      },
      {
        label: "Buy durable new",
        detail: "Lower annual impact if the item replaces multiple short-lived purchases.",
        estimatedKgCO2eSaved: round(durableReduction),
      },
    ],
    confidence: itemKey === "jacket" ? "high" : "medium",
  };
}
