"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CalendarRange,
  Compass,
  MapPinned,
  Search,
  ShieldCheck,
  Star,
  SunMedium,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  familyMembers,
  initialVotes,
} from "@/lib/seed/alghero-places";
import { Collection, Place, VoteRecord, VoteValue } from "@/lib/types";

const MapView = dynamic(
  () => import("@/components/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
  },
);

const sections = [
  { id: "dashboard", label: "Dashboard", icon: Compass },
  { id: "beaches", label: "Beaches", icon: Waves },
  { id: "things", label: "Things to Do", icon: SunMedium },
  { id: "restaurants", label: "Restaurants", icon: Star },
  { id: "family", label: "Family Picks", icon: ShieldCheck },
  { id: "map", label: "Map", icon: MapPinned },
  { id: "itinerary", label: "Itinerary", icon: CalendarRange },
];

const categoryToSection = {
  beach: "beaches",
  restaurant: "restaurants",
  activity: "things",
  viewpoint: "things",
  town: "things",
  excursion: "things",
  local_tip: "dashboard",
} as const;

const voteWeights: Record<VoteValue, number> = {
  must_do: 3,
  interested: 1,
  not_for_me: -2,
};

function getScore(votes: VoteRecord[]) {
  return votes.reduce((sum, vote) => {
    const rankingBonus = vote.ranking ? 6 - vote.ranking : 0;
    return sum + voteWeights[vote.vote] + rankingBonus;
  }, 0);
}

function getWeatherSuggestions(weatherMode: string) {
  if (weatherMode === "windy") {
    return {
      title: "Strong Maestrale mode",
      body: "Lean toward Mugoni, Porto Conte, or sport-focused outings. Keep exposed west-facing swims as a maybe.",
    };
  }

  if (weatherMode === "cloudy") {
    return {
      title: "Cloudy-day plan",
      body: "Shift focus to Old Town, Neptune's Grotto, Nuraghe Palmavera, and easy food routes.",
    };
  }

  if (weatherMode === "hot") {
    return {
      title: "Very hot day rhythm",
      body: "Start early, protect shade, then save Bastioni or Capo Caccia for the evening.",
    };
  }

  return {
    title: "Calm beach-weather day",
    body: "Prime setup for Maria Pia, Le Bombarde, Mugoni, or the birthday boat plan.",
  };
}

function familyName(userId: string) {
  return familyMembers.find((member) => member.id === userId)?.name ?? userId;
}

function voteLabel(vote: VoteValue) {
  return vote === "must_do"
    ? "Must do"
    : vote === "interested"
      ? "Interested"
      : "Not for me";
}

function voteTone(vote: VoteValue) {
  return vote === "must_do" ? "sea" : vote === "interested" ? "sand" : "coral";
}

export function AlgheroApp({
  initialPlaces,
  collections,
}: {
  initialPlaces: Place[];
  collections: Collection[];
}) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [weatherMode, setWeatherMode] = useState("calm");
  const [selectedMember, setSelectedMember] = useState(familyMembers[0].id);
  const [selectedTag, setSelectedTag] = useState("All");
  const [search, setSearch] = useState("");
  const [votes, setVotes] = useState(initialVotes);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>(["All"]);
    initialPlaces.forEach((place) => place.tags.forEach((tag) => tagSet.add(tag)));
    return [...tagSet];
  }, [initialPlaces]);

  const filteredPlaces = useMemo(() => {
    return initialPlaces.filter((place) => {
      const sectionMatch =
        activeSection === "dashboard" ||
        activeSection === "family" ||
        activeSection === "map" ||
        activeSection === "itinerary"
          ? true
          : categoryToSection[place.category] === activeSection;

      const tagMatch = selectedTag === "All" || place.tags.includes(selectedTag);

      const haystack = [
        place.title,
        place.area,
        place.shortDescription,
        place.longDescription,
        place.localTip,
        ...place.bestFor,
        ...place.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return sectionMatch && tagMatch && haystack.includes(search.toLowerCase());
    });
  }, [activeSection, initialPlaces, search, selectedTag]);

  const rankedPlaces = useMemo(() => {
    return [...filteredPlaces]
      .map((place) => ({
        place,
        placeVotes: votes.filter((vote) => vote.placeId === place.id),
      }))
      .sort((a, b) => getScore(b.placeVotes) - getScore(a.placeVotes));
  }, [filteredPlaces, votes]);

  const topPicks = rankedPlaces.slice(0, 5);
  const weatherPanel = getWeatherSuggestions(weatherMode);

  function updateVote(placeId: string, vote: VoteValue) {
    const existing = votes.find(
      (item) => item.placeId === placeId && item.userId === selectedMember,
    );

    if (existing) {
      setVotes((current) =>
        current.map((item) =>
          item.placeId === placeId && item.userId === selectedMember
            ? { ...item, vote }
            : item,
        ),
      );
      return;
    }

    setVotes((current) => [...current, { placeId, userId: selectedMember, vote }]);
  }

  return (
    <main className="min-h-screen bg-[var(--sand-100)] text-[var(--ink-900)]">
      <section className="relative overflow-hidden border-b border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_rgba(255,247,235,0.72)_45%,_rgba(16,100,131,0.18)_100%)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--sea-700)]">
                Fred&apos;s family votes
              </div>
              <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
                Pick your Alghero adventure like a shared planning board.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-700)]">
                Beaches, food, day trips, and real local warnings in one warm-weather decision board for adults and teenagers.
              </p>
            </div>
            <Badge tone="sea" className="hidden md:inline-flex">
              Base: Via Alessandro Volta 36
            </Badge>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sea-700)]">
              Family members
            </div>
            <div className="mt-4 text-2xl font-semibold text-[var(--ink-900)]">
              Vote as
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className={`rounded-full border px-5 py-3 text-sm font-medium transition sm:text-base ${
                    selectedMember === member.id
                      ? "border-[var(--sea-700)] bg-[var(--sea-50)] text-[var(--sea-800)]"
                      : "border-[var(--sand-300)] bg-white text-[var(--ink-800)]"
                  }`}
                >
                  {member.emoji} {member.name}
                </button>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(11,93,125,0.96),rgba(7,65,88,0.92))] text-white">
              <div className="grid gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
                <div>
                  <Badge tone="sand">Today&apos;s rhythm</Badge>
                  <h2 className="mt-4 text-2xl font-semibold">{weatherPanel.title}</h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-white/80">
                    {weatherPanel.body}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["calm", "hot", "windy", "cloudy"].map((mode) => (
                      <Button
                        key={mode}
                        variant={weatherMode === mode ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setWeatherMode(mode)}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/15 bg-white/10 p-5">
                  <div className="text-sm text-white/70">Best options today</div>
                  <div className="mt-4 space-y-3">
                    {topPicks.slice(0, 3).map(({ place, placeVotes }) => (
                      <div
                        key={place.id}
                        className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3"
                      >
                        <div>
                          <div className="font-medium">{place.title}</div>
                          <div className="text-xs text-white/70">{place.area}</div>
                        </div>
                        <Badge tone="sand">{getScore(placeVotes)} pts</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
                Shared filters
              </div>
              <div className="mt-4 space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[var(--ink-500)]" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search beaches, local tips, tags, and routes"
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 14).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        selectedTag === tag
                          ? "bg-[var(--coral-500)] text-white"
                          : "bg-[var(--sand-200)] text-[var(--ink-800)]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-[rgba(18,76,103,0.08)] bg-[rgba(255,248,239,0.88)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-8">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-[var(--sea-700)] text-white"
                    : "bg-white/80 text-[var(--ink-700)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-10">
        {(activeSection === "dashboard" || activeSection === "family") && (
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <div className="text-sm font-semibold text-[var(--sea-700)]">Everyone agrees</div>
              <div className="mt-3 text-2xl font-semibold">
                {
                  rankedPlaces.filter(
                    ({ placeVotes }) =>
                      placeVotes.length >= 2 &&
                      placeVotes.every((vote) => vote.vote !== "not_for_me"),
                  ).length
                }
              </div>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Picks without any hard no from the family.
              </p>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold text-[var(--coral-700)]">Split opinion</div>
              <div className="mt-3 text-2xl font-semibold">
                {
                  rankedPlaces.filter(
                    ({ placeVotes }) =>
                      placeVotes.some((vote) => vote.vote === "must_do") &&
                      placeVotes.some((vote) => vote.vote === "not_for_me"),
                  ).length
                }
              </div>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Places worth discussing before locking the itinerary.
              </p>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold text-[var(--sand-900)]">Needs booking</div>
              <div className="mt-3 text-2xl font-semibold">
                {initialPlaces.filter((place) => place.bookingRequired).length}
              </div>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Built-in warnings for La Pelosa, Neptune&apos;s Grotto, and reservation-led dinners.
              </p>
            </Card>
          </div>
        )}

        {activeSection === "dashboard" && (
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            {collections.map((collection) => (
              <Card key={collection.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
                      Suggested route
                    </div>
                    <h3 className="mt-2 text-xl font-semibold">{collection.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                      {collection.description}
                    </p>
                  </div>
                  <Badge tone="coral">{collection.placeSlugs.length} stops</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {collection.placeSlugs.map((slug) => {
                    const place = initialPlaces.find((item) => item.slug === slug);
                    return place ? (
                      <Badge key={slug} tone={place.badgeTone ?? "sand"}>
                        {place.title}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}

        {(activeSection === "dashboard" ||
          activeSection === "beaches" ||
          activeSection === "things" ||
          activeSection === "restaurants") && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rankedPlaces.map(({ place, placeVotes }) => (
              <Card key={place.id} className="overflow-hidden">
                <div className="relative h-56">
                  <Image
                    src={place.imageUrl}
                    alt={place.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2">
                    <Badge tone={place.badgeTone ?? "sand"}>{place.category}</Badge>
                    {place.bookingRequired ? <Badge tone="coral">Needs booking</Badge> : null}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-2xl font-semibold">{place.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{place.area}</p>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <p className="text-sm leading-6 text-[var(--ink-700)]">{place.shortDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    {place.bestFor.slice(0, 4).map((item) => (
                      <Badge key={item} tone="sea">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-[var(--ink-700)]">
                    <div>
                      <div className="font-semibold text-[var(--ink-900)]">Travel</div>
                      <div>
                        {place.driveTimeMinutes
                          ? `${place.driveTimeMinutes} min drive`
                          : `${place.walkTimeMinutes ?? "?"} min walk`}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--ink-900)]">Family score</div>
                      <div>{getScore(placeVotes)} points</div>
                    </div>
                  </div>
                  {place.localTip ? (
                    <div className="rounded-3xl bg-[var(--sand-150)] p-4 text-sm leading-6 text-[var(--ink-700)]">
                      <span className="font-semibold text-[var(--ink-900)]">Local tip:</span> {place.localTip}
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Vote quickly</div>
                    <div className="flex flex-wrap gap-2">
                      {(["must_do", "interested", "not_for_me"] as VoteValue[]).map((vote) => (
                        <Button
                          key={vote}
                          size="sm"
                          variant="secondary"
                          onClick={() => updateVote(place.id, vote)}
                        >
                          {voteLabel(vote)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {placeVotes.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Family reactions</div>
                      <div className="flex flex-wrap gap-2">
                        {placeVotes.map((vote) => (
                          <Badge key={`${vote.userId}-${vote.placeId}`} tone={voteTone(vote.vote)}>
                            {familyName(vote.userId)}: {voteLabel(vote.vote)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="text-xs text-[var(--ink-500)]">Source: {place.sourceLabel}</div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeSection === "family" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
                Top combined picks
              </div>
              <div className="mt-4 space-y-3">
                {topPicks.map(({ place, placeVotes }, index) => (
                  <div
                    key={place.id}
                    className="grid gap-3 rounded-[24px] border border-[var(--sand-300)] px-4 py-4 md:grid-cols-[56px_1fr_120px]"
                  >
                    <div className="text-3xl font-semibold text-[var(--sea-700)]">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{place.title}</div>
                      <div className="text-sm text-[var(--ink-600)]">{place.shortDescription}</div>
                    </div>
                    <div className="flex items-center justify-start md:justify-end">
                      <Badge tone="coral">{getScore(placeVotes)} pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--coral-700)]">
                Comments snapshot
              </div>
              <div className="mt-4 space-y-3">
                {votes
                  .filter((vote) => vote.comment)
                  .slice(0, 8)
                  .map((vote) => (
                    <div key={`${vote.userId}-${vote.placeId}`} className="rounded-3xl bg-[var(--sand-150)] p-4">
                      <div className="text-sm font-semibold">
                        {familyName(vote.userId)} on{" "}
                        {initialPlaces.find((place) => place.id === vote.placeId)?.title}
                      </div>
                      <div className="mt-1 text-sm text-[var(--ink-700)]">{vote.comment}</div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {activeSection === "map" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <MapView places={initialPlaces} />
            <Card className="p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
                Map legend
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div>Blue markers: beaches</div>
                <div>Orange markers: restaurants</div>
                <div>Green markers: activities</div>
                <div>Purple markers: viewpoints</div>
                <div>Grey markers: local tips</div>
              </div>
              <div className="mt-6 rounded-[24px] bg-[var(--sand-150)] p-4 text-sm leading-6 text-[var(--ink-700)]">
                Seeded coordinates are ready for the first mapped experience. The app structure is also prepared for a Supabase-backed places table later.
              </div>
            </Card>
          </div>
        )}

        {activeSection === "itinerary" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sea-700)]">
                Day 1 draft
              </div>
              <div className="mt-4 space-y-3">
                {["Lido di Alghero", "Old Town", "Bastioni Sunset Walk", "Gelateria 9 3/4"].map((item, index) => (
                  <div key={item} className="rounded-[24px] border border-[var(--sand-300)] px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--ink-500)]">
                      Stop {index + 1}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{item}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--coral-700)]">
                Planner warnings
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-700)]">
                <div>Do not combine too many distant west-coast and Stintino stops in one day.</div>
                <div>Le Bombarde and Maria Pia want early arrival if beach setup matters.</div>
                <div>Neptune&apos;s Grotto and La Pelosa should surface booking warnings before being added.</div>
                <div>Very hot days should bias early beach plus evening town plans.</div>
              </div>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}
