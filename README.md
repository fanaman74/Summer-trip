# Summer-trip

Alghero family holiday planner built with Next.js, Tailwind CSS, Leaflet, and Supabase-ready scaffolding.

## Local development

```bash
npm install
npm run dev
```

The app runs locally at `http://localhost:3000` by default, or the next open port if `3000` is already in use.

## Supabase

Create a local `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The current project includes:

- a seeded Alghero family planning UI
- map-based browsing
- family voting and ranking
- Supabase schema and RLS starter SQL
- real TripAdvisor ratings, review counts, and review tags per place

## TripAdvisor data (Apify)

Place ratings come from TripAdvisor, collected with the
[Apify Tripadvisor Scraper](https://apify.com/maxcopell/tripadvisor) and stored in
`src/data/tripadvisor.json` so the site never calls TripAdvisor at runtime.

To refresh the data, add your Apify token to `.env.local`:

```bash
APIFY_API_TOKEN=
```

then run:

```bash
npm run collect:tripadvisor
```

The script scrapes Alghero, Stintino, and Bosa listings, matches them to the seed
places in `src/lib/seed/alghero-places.ts`, and rewrites the JSON dataset. Actor
runs are billed against your Apify account (a few hundred results per refresh).
