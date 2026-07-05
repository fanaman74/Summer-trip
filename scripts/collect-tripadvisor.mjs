// Collects TripAdvisor ratings/reviews for the seed places via the Apify
// "maxcopell/tripadvisor" actor and writes src/data/tripadvisor.json.
//
// Usage: node --env-file=.env.local scripts/collect-tripadvisor.mjs
// Requires APIFY_API_TOKEN (https://console.apify.com/account#/integrations).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR = "maxcopell~tripadvisor";
const TOKEN = process.env.APIFY_API_TOKEN;

if (!TOKEN) {
  console.error("Missing APIFY_API_TOKEN. Run with: node --env-file=.env.local scripts/collect-tripadvisor.mjs");
  process.exit(1);
}

// One actor run per destination/category. Attractions and restaurants run
// separately because a mixed run lets restaurants exhaust the item budget
// before the major beaches and landmarks appear.
const searchQueries = [
  { query: "Alghero", maxItemsPerQuery: 250, includeAttractions: true, includeRestaurants: false },
  { query: "Alghero", maxItemsPerQuery: 150, includeAttractions: false, includeRestaurants: true },
  { query: "Stintino", maxItemsPerQuery: 80, includeAttractions: true, includeRestaurants: false },
  { query: "Bosa", maxItemsPerQuery: 60, includeAttractions: true, includeRestaurants: false },
];

// Previously collected Apify dataset IDs can be merged in to avoid paying
// for the same scrape twice: --datasets=id1,id2
const extraDatasetIds = process.argv
  .find((arg) => arg.startsWith("--datasets="))
  ?.slice("--datasets=".length)
  .split(",")
  .filter(Boolean) ?? [];

// --attractions-only skips the restaurant runs (useful when restaurant data
// is already supplied via --datasets).
const attractionsOnly = process.argv.includes("--attractions-only");

// --targeted-only skips the broad destination runs and only issues the
// narrow per-place queries below. Useful once the broad runs are cached and
// only a handful of landmark places are still unmatched.
const targetedOnly = process.argv.includes("--targeted-only");

// Broad "Alghero"-style searches surface tour operators and small shops
// before famous landmarks, so well-known places get their own narrow query.
const targetedQueries = [
  "La Pelosa Stintino",
  "Bosa Sardinia historic center",
  "Alghero Old Town Sardinia",
  "Bastioni di Alghero",
  "Nuraghe Palmavera Alghero",
  "Porto Ferro beach Alghero",
  "Spiaggia di Mugoni Alghero",
  "Spiaggia Maria Pia Alghero",
].map((query) => ({ query, maxItemsPerQuery: 5, includeAttractions: true, includeRestaurants: false }));

// Extra name candidates for slugs whose seed title differs from the
// TripAdvisor listing name. Matching is diacritic/punctuation-insensitive.
const nameHints = {
  "lido-di-alghero": ["Spiaggia di San Giovanni", "Lido San Giovanni", "Lido di Alghero"],
  "spiaggia-di-maria-pia": ["Maria Pia"],
  "le-bombarde": ["Spiaggia delle Bombarde", "Bombarde"],
  lazzaretto: ["Spiaggia del Lazzaretto", "Lazzaretto"],
  "mugoni-beach": ["Spiaggia Mugoni", "Mugoni"],
  "porto-ferro": ["Porto Ferro"],
  "le-saline": ["Le Saline"],
  "sardigna-beach-le-saline": ["Sardigna Beach"],
  "cala-cumpoltitu": ["Cumpoltitu"],
  "spiaggia-di-poglina": ["Poglina", "Spiaggia della Speranza", "La Speranza"],
  "la-pelosa": ["La Pelosa"],
  "capo-caccia-belvedere": ["Capo Caccia"],
  "neptunes-grotto": ["Grotta di Nettuno", "Grotte di Nettuno", "Neptune's Grotto", "Neptune's Cave"],
  "stintino-boat-excursion": ["Asinara Charter", "Asinara"],
  "alghero-old-town": ["Centro Storico di Alghero", "Alghero Old Town", "Centro Storico"],
  "bastioni-sunset-walk": ["Bastioni di Alghero", "Bastioni Marco Polo", "Bastioni"],
  "nuraghe-palmavera": ["Palmavera"],
  "punta-giglio-porto-conte": ["Punta Giglio", "Parco di Porto Conte"],
  bosa: ["Centro Storico di Bosa", "Castello Malaspina", "Bosa Old Town"],
  "il-chiosco-le-bombarde": ["Chiosco Le Bombarde", "Il Chiosco"],
  "bar-ristorante-da-bruno": ["Da Bruno"],
  "il-baretto-di-porto-ferro": ["Baretto"],
  "lido-hermeu-kiosk": ["Hermeu"],
  "il-milese": ["Milese", "Focacceria Milese"],
  "trattoria-caragol": ["Caragol"],
  "licchita-pizzeria-moderna": ["Licchita"],
  "gelateria-9-3-4": ["Gelateria Artigianale", "I Golosi"],
};

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function loadSeedPlaces() {
  const source = await readFile(
    path.join(process.cwd(), "src/lib/seed/alghero-places.ts"),
    "utf8",
  );
  const placeEntries = [];
  const blockRegex = /slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)",\s*\n\s*category:\s*"([^"]+)"/g;
  let match;
  while ((match = blockRegex.exec(source)) !== null) {
    const [, slug, title, category] = match;
    if (category !== "local_tip") {
      placeEntries.push({ slug, title, category });
    }
  }
  return placeEntries;
}

async function apify(pathname, init = {}) {
  const response = await fetch(`${APIFY_BASE}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Apify ${pathname} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function runQuery({ query, maxItemsPerQuery, includeAttractions, includeRestaurants }) {
  const kind = includeRestaurants ? "restaurants" : "attractions";
  console.log(`Starting actor run for "${query}" ${kind} (max ${maxItemsPerQuery} items)...`);
  const { data: run } = await apify(`/acts/${ACTOR}/runs`, {
    method: "POST",
    body: JSON.stringify({
      query,
      maxItemsPerQuery,
      includeAttractions,
      includeRestaurants,
      includeHotels: false,
      includeTags: true,
      includeNearbyResults: false,
      language: "en",
      currency: "EUR",
    }),
  });

  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 15000));
    const { data: status } = await apify(`/actor-runs/${run.id}`);
    console.log(`  [${query}] ${status.status}`);
    if (status.status === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status.status)) {
      throw new Error(`Run for "${query}" ended with status ${status.status}`);
    }
  }

  const items = await apify(`/datasets/${run.defaultDatasetId}/items?clean=true&limit=1000`);
  console.log(`  [${query}] collected ${items.length} items`);
  return items.map((item) => ({ ...item, matchedQuery: query }));
}

function matchPlaces(seedPlaces, items) {
  const matched = {};
  const unmatched = [];

  for (const place of seedPlaces) {
    const candidates = [place.title, ...(nameHints[place.slug] ?? [])].map(normalize);
    const wantsRestaurant = place.category === "restaurant";

    const scoreItems = (pool) =>
      pool
        .filter((item) => item.name)
        .map((item) => {
          const itemName = normalize(item.name);
          let score = 0;
          for (const candidate of candidates) {
            if (!candidate) continue;
            if (itemName === candidate) score = Math.max(score, candidate.length * 3);
            else if (itemName.includes(candidate) || candidate.includes(itemName)) {
              score = Math.max(score, Math.min(candidate.length, itemName.length));
            }
          }
          return { item, score };
        })
        .filter(({ score }) => score >= 6)
        .sort(
          (a, b) =>
            b.score - a.score || (b.item.numberOfReviews ?? 0) - (a.item.numberOfReviews ?? 0),
        );

    const restaurants = items.filter((item) => item.type === "RESTAURANT");
    const attractions = items.filter((item) => item.type !== "RESTAURANT");

    // Beach kiosks are sometimes listed on TripAdvisor as attractions, so
    // restaurant seeds fall back to the attraction pool.
    const scored = wantsRestaurant
      ? scoreItems(restaurants).concat(scoreItems(attractions))
      : scoreItems(attractions);

    const best = scored[0]?.item;
    if (!best) {
      unmatched.push(place.slug);
      continue;
    }

    matched[place.slug] = {
      name: best.name,
      rating: best.rating ?? null,
      numberOfReviews: best.numberOfReviews ?? null,
      rankingString: best.rankingString ?? null,
      priceRange: best.priceRange ?? best.priceLevel ?? null,
      webUrl: best.webUrl ?? null,
      imageUrl: best.image ?? null,
      type: best.type ?? null,
      subcategories: (best.subcategories ?? []).slice(0, 4),
      reviewTags: (best.reviewTags ?? []).slice(0, 6).map((tag) => tag.text ?? tag),
      matchedQuery: best.matchedQuery,
    };
  }

  return { matched, unmatched };
}

const seedPlaces = await loadSeedPlaces();
console.log(`Loaded ${seedPlaces.length} seed places (local tips excluded).`);

const allItems = [];
for (const datasetId of extraDatasetIds) {
  const items = await apify(`/datasets/${datasetId}/items?clean=true&limit=1000`);
  console.log(`Merged ${items.length} items from cached dataset ${datasetId}.`);
  allItems.push(...items.map((item) => ({ ...item, matchedQuery: `dataset:${datasetId}` })));
}
if (!targetedOnly) {
  for (const searchQuery of searchQueries) {
    if (attractionsOnly && searchQuery.includeRestaurants) continue;
    allItems.push(...(await runQuery(searchQuery)));
  }
}
for (const searchQuery of targetedQueries) {
  allItems.push(...(await runQuery(searchQuery)));
}

const { matched, unmatched } = matchPlaces(seedPlaces, allItems);
console.log(`Matched ${Object.keys(matched).length}/${seedPlaces.length} places.`);
if (unmatched.length > 0) {
  console.log(`Unmatched slugs: ${unmatched.join(", ")}`);
}

const outputPath = path.join(process.cwd(), "src/data/tripadvisor.json");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: "TripAdvisor via Apify maxcopell/tripadvisor",
      places: matched,
    },
    null,
    2,
  )}\n`,
);
console.log(`Wrote ${outputPath}`);
