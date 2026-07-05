import { AlgheroApp } from "@/components/alghero-app";
import { places, suggestedCollections } from "@/lib/seed/alghero-places";

export default function Home() {
  return <AlgheroApp initialPlaces={places} collections={suggestedCollections} />;
}
