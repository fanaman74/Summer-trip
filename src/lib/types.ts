export type PlaceCategory =
  | "beach"
  | "restaurant"
  | "activity"
  | "viewpoint"
  | "town"
  | "excursion"
  | "local_tip";

export type VoteValue = "must_do" | "interested" | "not_for_me";

export type FamilyMember = {
  id: string;
  name: string;
  role: "admin" | "member";
  emoji: string;
};

export type Place = {
  id: string;
  slug: string;
  title: string;
  category: PlaceCategory;
  shortDescription: string;
  longDescription: string;
  area: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  driveTimeMinutes?: number;
  walkTimeMinutes?: number;
  priceLevel: "free" | "budget" | "medium" | "expensive" | "luxury";
  estimatedCostText?: string;
  bookingRequired?: boolean;
  bookingUrl?: string;
  officialUrl?: string;
  imageUrl: string;
  bestFor: string[];
  avoidIf: string[];
  tags: string[];
  localTip?: string;
  weatherNotes?: string;
  parkingNotes?: string;
  foodNotes?: string;
  sourceLabel: string;
  badgeTone?: "sea" | "sand" | "coral" | "leaf";
};

export type PlaceSource = {
  label: string;
  url: string;
  kind: "official" | "guide" | "reviews" | "planning";
};

export type VoteRecord = {
  userId: string;
  placeId: string;
  vote: VoteValue;
  ranking?: number;
  comment?: string;
};

export type Collection = {
  id: string;
  title: string;
  description: string;
  placeSlugs: string[];
};
