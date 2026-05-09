import routesJson from "../../../data/travel_routes.json";
import type { TravelAdviceInput, TravelAdviceResult } from "./types";

type RouteRecord = {
  origin: string;
  destination: string;
  distanceKmOneWay: number;
  train: { kgCO2ePerPassengerKm: number; durationMinutes: number; notes: string };
  car: { kgCO2ePerVehicleKm: number; durationMinutes: number; notes: string };
};

const routes = routesJson as Record<string, RouteRecord>;

function key(origin: string, destination: string): string {
  return `${origin.trim().toLowerCase()}:${destination.trim().toLowerCase()}`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function compareTravel({
  origin,
  destination,
  passengers = 1,
}: TravelAdviceInput): TravelAdviceResult {
  const route =
    routes[key(origin, destination)] ??
    routes[key(destination, origin)] ??
    routes["lausanne:milan"];
  const passengerCount = Math.max(1, Math.round(passengers || 1));
  const roundTripKm = route.distanceKmOneWay * 2;
  const trainKgPerPassenger = roundTripKm * route.train.kgCO2ePerPassengerKm;
  const carVehicleKg = roundTripKm * route.car.kgCO2ePerVehicleKm;
  const carKgPerPassenger = carVehicleKg / passengerCount;

  const train = {
    mode: "train" as const,
    kgCO2e: round(trainKgPerPassenger * passengerCount),
    kgCO2ePerPassenger: round(trainKgPerPassenger),
    durationMinutes: route.train.durationMinutes,
    notes: route.train.notes,
  };
  const car = {
    mode: "car" as const,
    kgCO2e: round(carVehicleKg),
    kgCO2ePerPassenger: round(carKgPerPassenger),
    durationMinutes: route.car.durationMinutes,
    notes: route.car.notes,
  };
  const bestMode = train.kgCO2ePerPassenger <= car.kgCO2ePerPassenger ? "train" : "car";
  const reduction = Math.abs(car.kgCO2ePerPassenger - train.kgCO2ePerPassenger);

  return {
    type: "travel",
    title: `${route.origin} to ${route.destination}`,
    origin: route.origin,
    destination: route.destination,
    passengers: passengerCount,
    distanceKmOneWay: route.distanceKmOneWay,
    roundTrip: true,
    modes: [train, car],
    bestMode,
    estimatedReductionKgCO2e: round(reduction),
    recommendation:
      bestMode === "train"
        ? `Take the train. It saves about ${round(reduction)} kg CO2e per passenger for a round trip.`
        : `With ${passengerCount} passengers, the car is the lower-carbon option for this stored route.`,
    confidence: route === routes["lausanne:milan"] ? "high" : "medium",
  };
}
