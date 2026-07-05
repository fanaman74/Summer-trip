import "server-only";

import { places } from "@/lib/seed/alghero-places";

type WikiImage = {
  title: string;
  imageUrl: string;
  pageUrl: string;
};

export type PlaceMedia = {
  heroImageUrl: string | null;
  gallery: WikiImage[];
  wikiTitle: string | null;
  wikiSummary: string | null;
  wikiPageUrl: string | null;
};

const placeMediaQueries: Record<
  string,
  {
    commonsQuery?: string;
    wikiTitle?: string;
  }
> = {
  "le-bombarde": {
    commonsQuery: "Spiaggia delle Bombarde Alghero",
    wikiTitle: "Spiaggia delle Bombarde",
  },
  "mugoni-beach": {
    commonsQuery: "Spiaggia di Mugoni Alghero",
    wikiTitle: "Spiaggia di Mugoni",
  },
  "porto-ferro": {
    commonsQuery: "Porto Ferro Sassari",
  },
  "nuraghe-palmavera": {
    commonsQuery: "Nuraghe Palmavera Alghero",
    wikiTitle: "Nuraghe Palmavera",
  },
  "alghero-old-town": {
    commonsQuery: "Alghero old town bastioni",
    wikiTitle: "Alghero",
  },
  "bastioni-sunset-walk": {
    commonsQuery: "Bastioni Alghero",
    wikiTitle: "Alghero",
  },
  "spiaggia-di-maria-pia": {
    commonsQuery: "Maria Pia Alghero beach",
  },
  "lido-di-alghero": {
    commonsQuery: "Lido di San Giovanni Alghero",
  },
  "capo-caccia-belvedere": {
    commonsQuery: "Capo Caccia Alghero",
    wikiTitle: "Capo Caccia",
  },
  "neptunes-grotto": {
    commonsQuery: "Grotta di Nettuno Capo Caccia",
    wikiTitle: "Neptune's Grotto",
  },
  "la-pelosa": {
    commonsQuery: "La Pelosa Stintino",
    wikiTitle: "La Pelosa",
  },
  "stintino-boat-excursion": {
    commonsQuery: "Stintino Asinara boat",
    wikiTitle: "Stintino",
  },
  bosa: {
    commonsQuery: "Bosa Sardinia",
    wikiTitle: "Bosa",
  },
};

function pickPlace(slug: string) {
  return places.find((place) => place.slug === slug);
}

function titleScore(placeTitle: string, candidateTitle: string) {
  const placeTokens = placeTitle.toLowerCase().split(/[\s/,-]+/).filter(Boolean);
  const candidate = candidateTitle.toLowerCase();
  return placeTokens.reduce((score, token) => score + (candidate.includes(token) ? 2 : 0), 0);
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Summer-trip/1.0",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function getPlaceMedia(slug: string): Promise<PlaceMedia> {
  const place = pickPlace(slug);
  const mediaConfig = placeMediaQueries[slug];

  if (!place) {
    return {
      heroImageUrl: null,
      gallery: [],
      wikiTitle: null,
      wikiSummary: null,
      wikiPageUrl: null,
    };
  }

  const commonsQuery =
    mediaConfig?.commonsQuery ?? `${place.title} ${place.area} Alghero Sardinia`;

  const commonsUrl =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search` +
    `&gsrsearch=${encodeURIComponent(commonsQuery)}` +
    `&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size&iiurlwidth=1600&origin=*`;

  const commonsData = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          imageinfo?: Array<{ url?: string; thumburl?: string; width?: number; height?: number }>;
        }
      >;
    };
  }>(commonsUrl);

  // Commons search sometimes surfaces tiny/legacy uploads (e.g. 75x75px)
  // that still score well on title match; excluding them keeps hero and
  // gallery images from being stretched blurry.
  const MIN_DIMENSION = 800;

  const pages = Object.values(commonsData?.query?.pages ?? {})
    .map((page) => ({
      title: page.title.replace(/^File:/, ""),
      imageUrl: page.imageinfo?.[0]?.url ?? page.imageinfo?.[0]?.thumburl ?? "",
      pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
      width: page.imageinfo?.[0]?.width ?? 0,
      height: page.imageinfo?.[0]?.height ?? 0,
      score: titleScore(place.title, page.title) + titleScore(commonsQuery, page.title),
    }))
    .filter(
      (page) =>
        page.imageUrl &&
        page.score >= 2 &&
        Math.max(page.width, page.height) >= MIN_DIMENSION,
    );

  const sortedPages = [...pages].sort((a, b) => b.score - a.score);
  const bestPage = sortedPages[0];

  let wikiSummary: string | null = null;
  let wikiPageUrl: string | null = bestPage?.pageUrl ?? null;

  if (mediaConfig?.wikiTitle) {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mediaConfig.wikiTitle)}`;
    const summaryData = await fetchJson<{
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    }>(summaryUrl);
    wikiSummary = summaryData?.extract ?? null;
    wikiPageUrl = summaryData?.content_urls?.desktop?.page ?? wikiPageUrl;
  }

  return {
    heroImageUrl: bestPage?.imageUrl ?? null,
    gallery: sortedPages.slice(0, 4).map(({ title, imageUrl, pageUrl }) => ({
      title,
      imageUrl,
      pageUrl,
    })),
    wikiTitle: bestPage?.title ?? null,
    wikiSummary,
    wikiPageUrl,
  };
}
