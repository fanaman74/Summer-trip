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

  if (!place || place.latitude === undefined || place.longitude === undefined) {
    return {
      heroImageUrl: null,
      gallery: [],
      wikiTitle: null,
      wikiSummary: null,
      wikiPageUrl: null,
    };
  }

  const geoUrl =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=geosearch` +
    `&ggscoord=${place.latitude}|${place.longitude}&ggsradius=10000&ggslimit=8` +
    `&prop=coordinates|pageimages&piprop=original|thumbnail&pithumbsize=1600&origin=*`;

  const geoData = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          original?: { source: string };
          thumbnail?: { source: string };
        }
      >;
    };
  }>(geoUrl);

  const pages = Object.values(geoData?.query?.pages ?? {})
    .map((page) => ({
      title: page.title,
      imageUrl: page.original?.source ?? page.thumbnail?.source ?? "",
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
      score: titleScore(place.title, page.title),
    }))
    .filter((page) => page.imageUrl);

  const sortedPages = [...pages].sort((a, b) => b.score - a.score);
  const bestPage = sortedPages[0];

  let wikiSummary: string | null = null;
  let wikiPageUrl: string | null = bestPage?.pageUrl ?? null;

  if (bestPage) {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestPage.title)}`;
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
