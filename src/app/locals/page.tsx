import Link from "next/link";
import { ArrowLeft, Info, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlaceCardImage } from "@/components/place-card-image";
import { isLocalRecommendation } from "@/lib/place-content";
import { places } from "@/lib/seed/alghero-places";
import { getTripAdvisorInfo } from "@/lib/tripadvisor";

const tipToneByBadge: Record<string, "sea" | "sand" | "coral" | "leaf"> = {
  coral: "coral",
  leaf: "leaf",
  sand: "sand",
  sea: "sea",
};

export default function LocalsPage() {
  const localTips = places.filter((place) => place.category === "local_tip");
  const localPicks = places.filter(isLocalRecommendation);

  return (
    <main className="min-h-screen bg-[var(--sand-100)] text-[var(--ink-900)]">
      <section className="relative overflow-hidden border-b border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_rgba(255,247,235,0.72)_45%,_rgba(16,100,131,0.18)_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-800)] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to planner
          </Link>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--sea-700)]">
              What locals recommend
            </div>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
              Skip the tourist traps. Here&apos;s what people who actually live here say.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-700)]">
              Picks pulled from insider B&amp;B guides, Italian food-critic roundups, and
              local recommendation lists — plus the practical rules that keep a beach day
              from going sideways.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:px-10">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
          Local know-how
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {localTips.map((tip) => (
            <Card key={tip.id} className="p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sea-700)]" />
                <div>
                  <div className="font-semibold text-[var(--ink-900)]">{tip.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                    {tip.longDescription}
                  </p>
                  {tip.localTip ? (
                    <Badge tone={tipToneByBadge[tip.badgeTone ?? "sand"]} className="mt-3">
                      {tip.localTip}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 lg:px-10">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
          Recommended by locals and insiders
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-700)]">
          Sourced from an Alghero B&amp;B&apos;s own insider guide, Gambero Rosso, and other
          local recommendation lists — not generic tourist listings.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {localPicks.map((place) => {
            const tripAdvisor = getTripAdvisorInfo(place.slug);

            return (
              <Card key={place.id} className="overflow-hidden">
                <div className="relative h-44">
                  <PlaceCardImage slug={place.slug} fallbackSrc={place.imageUrl} alt={place.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4">
                    <Badge tone={place.badgeTone ?? "sand"}>{place.category}</Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-semibold">{place.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{place.area}</p>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  {tripAdvisor?.rating ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sand-150)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-800)]">
                      <Star className="h-3.5 w-3.5 fill-[var(--coral-500)] text-[var(--coral-500)]" />
                      {tripAdvisor.rating.toFixed(1)}
                      {tripAdvisor.numberOfReviews ? (
                        <span className="font-normal text-[var(--ink-600)]">
                          ({tripAdvisor.numberOfReviews.toLocaleString("en-GB")} Tripadvisor reviews)
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {place.localTip ? (
                    <p className="rounded-[20px] bg-[var(--sand-150)] p-4 text-sm leading-6 text-[var(--ink-700)]">
                      &ldquo;{place.localTip}&rdquo;
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
                      Source: {place.sourceLabel}
                    </span>
                    <Link
                      href={`/places/${place.slug}`}
                      className="text-sm font-semibold text-[var(--sea-700)] underline-offset-4 hover:underline"
                    >
                      View place
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
