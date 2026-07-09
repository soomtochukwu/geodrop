"use client";

import { Fragment, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapDrop = {
  address: string;
  lat: number;
  lng: number;
  radius: number;
  name: string;
  rewardSol: string;
  slotsLeft: number;
  isNearest: boolean;
  highlight: boolean;
};

type HunterMapProps = {
  user: { lat: number; lng: number };
  drops: MapDrop[];
};

const userIcon = L.divIcon({
  className: "user-marker",
  html: '<div class="user-marker-dot"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function dropIcon(color: string) {
  return L.divIcon({
    className: "drop-marker",
    html: `<div class="drop-marker-pin" style="background:${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
  });
}

/** Keeps the map centered on the hunter as they move. */
function FollowUser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!hasCentered.current) {
      map.setView([lat, lng], 16);
      hasCentered.current = true;
    } else {
      map.panTo([lat, lng]);
    }
  }, [map, lat, lng]);

  return null;
}

export default function HunterMap({ user, drops }: HunterMapProps) {
  return (
    <MapContainer
      center={[user.lat, user.lng]}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      <FollowUser lat={user.lat} lng={user.lng} />

      <Marker position={[user.lat, user.lng]} icon={userIcon} />

      {drops.map((drop) => (
        <Fragment key={drop.address}>
          <Marker
            position={[drop.lat, drop.lng]}
            icon={dropIcon(drop.isNearest ? "#6366f1" : "#a1a1aa")}
          >
            <Popup>
              <strong>{drop.name}</strong>
              <br />
              Reward: {drop.rewardSol} SOL
              <br />
              {drop.slotsLeft} slots left
            </Popup>
          </Marker>
          <Circle
            center={[drop.lat, drop.lng]}
            radius={drop.radius}
            pathOptions={{
              color: drop.highlight ? "#00ff00" : "rgba(99, 102, 241, 0.5)",
              fillColor: drop.highlight ? "#00ff00" : "#6366f1",
              fillOpacity: drop.highlight ? 0.2 : 0.1,
              weight: 1,
            }}
          />
        </Fragment>
      ))}
    </MapContainer>
  );
}
