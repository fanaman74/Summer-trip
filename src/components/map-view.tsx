"use client";

import { DivIcon, LatLngExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { Place } from "@/lib/types";

const colorMap = {
  beach: "#1d6c8a",
  restaurant: "#f07a4b",
  activity: "#427f58",
  viewpoint: "#7354a3",
  town: "#d6a656",
  excursion: "#d85163",
  local_tip: "#6f7d85",
} as const;

const baseLocation: LatLngExpression = [40.5607, 8.3193];

function iconFor(place: Place) {
  const fill = colorMap[place.category];

  return new DivIcon({
    className: "",
    html: `<div style="background:${fill};width:16px;height:16px;border-radius:999px;border:3px solid white;box-shadow:0 8px 20px rgba(0,0,0,0.22)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function MapView({ places }: { places: Place[] }) {
  const mappablePlaces = places.filter(
    (place) => place.latitude !== undefined && place.longitude !== undefined,
  );

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/50">
      <MapContainer
        center={baseLocation}
        zoom={10}
        className="h-[360px] w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappablePlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude!, place.longitude!]}
            icon={iconFor(place)}
          >
            <Popup>
              <div className="space-y-1">
                <div className="text-sm font-semibold">{place.title}</div>
                <div className="text-xs text-slate-600">{place.area}</div>
                <div className="text-xs">{place.shortDescription}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
