import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPinned } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPlaceReviewHighlights, getPlaceSources } from "@/lib/place-content";
import { getPlaceMedia } from "@/lib/place-media.server";
import { places } from "@/lib/seed/alghero-places";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = places.find((item) => item.slug === slug);

  if (!place) {
    notFound();
  }

  const media = await getPlaceMedia(slug);
  const highlights = getPlaceReviewHighlights(place);
  const sources = getPlaceSources(place);
  const hero = media.heroImageUrl ?? place.imageUrl;

  return (
    <main className="min-h-screen bg-[var(--sand-100)] px-4 py-8 text-[var(--ink-900)] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-800)] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to planner
        </Link>

        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-[360px]">
              <Image src={hero} alt={place.title} fill className="object-cover" sizes="100vw" unoptimized />
            </div>
            <div className="space-y-5 p-6 lg:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge tone={place.badgeTone ?? "sand"}>{place.category}</Badge>
                {place.bookingRequired ? <Badge tone="coral">Needs booking</Badge> : null}
              </div>
              <div>
                <h1 className="font-serif text-4xl leading-tight">{place.title}</h1>
                <p className="mt-2 text-lg text-[var(--ink-600)]">{place.area}</p>
              </div>
              <p className="text-base leading-7 text-[var(--ink-700)]">{place.longDescription}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold">Travel</div>
                  <div className="text-sm text-[var(--ink-700)]">
                    {place.driveTimeMinutes
                      ? `${place.driveTimeMinutes} min drive from base`
                      : `${place.walkTimeMinutes ?? "?"} min walk from base`}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold">Price</div>
                  <div className="text-sm text-[var(--ink-700)]">
                    {place.estimatedCostText ?? place.priceLevel}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {place.bestFor.map((item) => (
                  <Badge key={item} tone="sea">
                    {item}
                  </Badge>
                ))}
              </div>
              {media.wikiSummary ? (
                <div className="rounded-[24px] bg-[var(--sand-150)] p-4 text-sm leading-6 text-[var(--ink-700)]">
                  <span className="font-semibold text-[var(--ink-900)]">Collected context:</span>{" "}
                  {media.wikiSummary}
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
              What people mention
            </div>
            <div className="mt-4 space-y-3">
              {highlights.map((item) => (
                <div key={item} className="rounded-[22px] bg-[var(--sand-150)] p-4 text-sm leading-6 text-[var(--ink-700)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[22px] border border-[var(--sand-300)] p-4 text-sm leading-6 text-[var(--ink-700)]">
              <div className="mb-2 font-semibold text-[var(--ink-900)]">Parking and planning</div>
              <div>{place.parkingNotes ?? "Check parking early in high season for the best setup."}</div>
              {place.weatherNotes ? <div className="mt-2">{place.weatherNotes}</div> : null}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
              Guide and review links
            </div>
            <div className="mt-4 space-y-3">
              {sources.map((source) => (
                <a
                  key={`${source.kind}-${source.label}`}
                  href={source.url === "#" ? undefined : source.url}
                  target={source.url === "#" ? undefined : "_blank"}
                  rel={source.url === "#" ? undefined : "noreferrer"}
                  className="flex items-center justify-between rounded-[22px] border border-[var(--sand-300)] px-4 py-4 text-sm text-[var(--ink-800)]"
                >
                  <span>{source.label}</span>
                  {source.url === "#" ? <span className="text-xs text-[var(--ink-500)]">in app</span> : <ExternalLink className="h-4 w-4" />}
                </a>
              ))}
            </div>
            {place.latitude !== undefined && place.longitude !== undefined ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--sea-700)] px-4 py-2 text-sm font-semibold text-white"
              >
                <MapPinned className="h-4 w-4" />
                Open in maps
              </a>
            ) : null}
          </Card>
        </div>

        <Card className="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
            Photo gallery
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(media.gallery.length > 0
              ? media.gallery.map((image) => ({
                  src: image.imageUrl,
                  label: image.title,
                  href: image.pageUrl,
                }))
              : [{ src: hero, label: place.title, href: "#" }]
            ).map((image) => (
              <a
                key={`${image.label}-${image.src}`}
                href={image.href === "#" ? undefined : image.href}
                target={image.href === "#" ? undefined : "_blank"}
                rel={image.href === "#" ? undefined : "noreferrer"}
                className="group overflow-hidden rounded-[24px] border border-[var(--sand-300)] bg-white"
              >
                <div className="relative h-48">
                  <Image
                    src={image.src}
                    alt={image.label}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                </div>
                <div className="p-3 text-sm text-[var(--ink-700)]">{image.label}</div>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
