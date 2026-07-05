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
