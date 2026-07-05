import { Place, PlaceSource } from "@/lib/types";

const attractionReviewsUrl =
  "https://www.tripadvisor.com/Attractions-g187880-Activities-Alghero_Province_of_Sassari_Sardinia.html";
const restaurantReviewsUrl =
  "https://www.tripadvisor.com/Restaurants-g187880-Alghero_Province_of_Sassari_Sardinia.html";
const algheroLifeUrl = "https://www.algherolife.com/en/guide/litorali-alghero/";
const sardiniaGuideUrl =
  "https://www.sardiniaunlimited.com/blog/discover-sardinia/what-to-do-in-alghero-sardinia";
const adventurousKateUrl = "https://www.adventurouskate.com/things-to-do-in-alghero-italy/";
const bonTravelerUrl = "https://www.bontraveler.com/things-to-do-in-alghero-sardinia/";
const aiguaRestaurantsUrl =
  "https://www.aigua.it/where-to-eat-in-alghero-10-restaurants-recommended-by-our-bb.html";
const gamberoRossoUrl =
  "https://www.gamberorossointernational.com/news/where-to-eat-in-alghero-the-7-best-places-chosen-by-gambero-rosso/";

export function getPlaceSources(place: Place): PlaceSource[] {
  const sources: PlaceSource[] = [];

  if (place.officialUrl) {
    sources.push({ label: "Official site", url: place.officialUrl, kind: "official" });
  }

  if (place.bookingUrl && place.bookingUrl !== place.officialUrl) {
    sources.push({ label: "Booking information", url: place.bookingUrl, kind: "official" });
  }

  sources.push({
    label: "Family planning notes",
    url: "#",
    kind: "planning",
  });

  if (place.category === "restaurant") {
    sources.push({ label: "Tripadvisor Alghero restaurants", url: restaurantReviewsUrl, kind: "reviews" });
    sources.push({ label: "Aigua Alghero restaurant guide", url: aiguaRestaurantsUrl, kind: "guide" });
    sources.push({ label: "Gambero Rosso Alghero food guide", url: gamberoRossoUrl, kind: "guide" });
  } else {
    sources.push({ label: "Tripadvisor Alghero attractions", url: attractionReviewsUrl, kind: "reviews" });
    sources.push({ label: "Alghero Life coast and beach guide", url: algheroLifeUrl, kind: "guide" });
    sources.push({ label: "Sardinia Unlimited Alghero guide", url: sardiniaGuideUrl, kind: "guide" });
  }

  if (place.slug === "neptunes-grotto") {
    sources.push({
      label: "Neptune's Grotto access information",
      url: "https://grottadinettuno.it/en/come-arrivare/",
      kind: "official",
    });
    sources.push({
      label: "Alghero Experience cave booking guide",
      url: "https://www.algheroexperience.it/en/neptunes-cave-booking.html",
      kind: "guide",
    });
  }

  if (place.slug === "la-pelosa") {
    sources.push({
      label: "Spiaggia La Pelosa official booking site",
      url: "https://spiaggialapelosa.it/en/",
      kind: "official",
    });
  }

  if (place.slug === "porto-ferro" || place.slug === "capo-caccia-belvedere") {
    sources.push({ label: "Adventurous Kate Alghero guide", url: adventurousKateUrl, kind: "guide" });
    sources.push({ label: "Bon Traveler Alghero guide", url: bonTravelerUrl, kind: "guide" });
  }

  return sources;
}

export function getPlaceReviewHighlights(place: Place) {
  return [
    place.shortDescription,
    place.localTip,
    place.weatherNotes,
    place.parkingNotes,
    place.foodNotes,
    place.bookingRequired ? "This place needs advance booking or pre-checking before you go." : undefined,
  ].filter(Boolean) as string[];
}
