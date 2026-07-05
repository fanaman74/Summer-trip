import rawData from "@/data/tripadvisor.json";

export type TripAdvisorInfo = {
  name: string;
  rating: number | null;
  numberOfReviews: number | null;
  rankingString: string | null;
  priceRange: string | null;
  webUrl: string | null;
  imageUrl: string | null;
  type: string | null;
  subcategories: string[];
  reviewTags: string[];
  matchedQuery: string;
};

type TripAdvisorData = {
  generatedAt: string;
  source: string;
  places: Record<string, TripAdvisorInfo>;
};

const data = rawData as unknown as TripAdvisorData;

export function getTripAdvisorInfo(slug: string): TripAdvisorInfo | null {
  return data.places[slug] ?? null;
}

export const tripAdvisorGeneratedAt = data.generatedAt;
