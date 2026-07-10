"use client";

import { Fragment, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";

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
  isClaimed: boolean;
  isExhausted: boolean;
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

function dropIcon(color: string, label?: string) {
  return L.divIcon({
    className: "drop-marker",
    html: `
      <div style="background:${color}; display:flex; align-items:center; justify-content:center; color:white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid rgba(255,255,255,0.7); width:22px; height:22px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
        <span style="transform: rotate(45deg); display: block; font-size: 11px; font-weight: bold; line-height: 1;">
          ${label || ""}
        </span>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
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

/** Leaflet Geosearch Control implementation for hunters to search addresses. */
function SearchField() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search location...",
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result: any) => {
      map.flyTo([result.location.y, result.location.x], 15);
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

/** Triggers Leaflet size invalidation after mounting to ensure the map renders correctly. */
function MapResizeTrigger() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function HunterMap({ user, drops }: HunterMapProps) {
  return (
    <MapContainer
      center={[user.lat, user.lng]}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      <FollowUser lat={user.lat} lng={user.lng} />
      <SearchField />
      <MapResizeTrigger />

      <Marker position={[user.lat, user.lng]} icon={userIcon} />

      {drops.map((drop) => {
        let color = "#6366f1"; // Active: Indigo
        let label = "A";
        let circleColor = "rgba(99, 102, 241, 0.5)";
        let circleFill = "#6366f1";

        if (drop.isClaimed) {
          color = "#10b981"; // Claimed/Past: Green
          label = "✔";
          circleColor = "rgba(16, 185, 129, 0.5)";
          circleFill = "#10b981";
        } else if (drop.isExhausted) {
          color = "#ef4444"; // Exhausted: Red
          label = "✖";
          circleColor = "rgba(239, 68, 68, 0.5)";
          circleFill = "#ef4444";
        } else if (drop.isNearest) {
          color = "#8b5cf6"; // Nearest: Violet
          label = "★";
        }

        return (
          <Fragment key={drop.address}>
            <Marker
              position={[drop.lat, drop.lng]}
              icon={dropIcon(color, label)}
            >
              <Popup>
                <div style={{ color: "#000", fontFamily: "var(--mono)", fontSize: "11px" }}>
                  <strong style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>{drop.name}</strong>
                  <div style={{ marginBottom: "2px" }}>Reward: <span style={{ color: "#10b981", fontWeight: "bold" }}>{drop.rewardSol} SOL</span></div>
                  <div style={{ marginBottom: "2px" }}>Slots Left: <strong>{drop.slotsLeft}</strong></div>
                  <div>Status: <span style={{ color, fontWeight: "bold" }}>
                    {drop.isClaimed ? "CLAIMED" : drop.isExhausted ? "EXHAUSTED" : "ACTIVE"}
                  </span></div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[drop.lat, drop.lng]}
              radius={drop.radius}
              pathOptions={{
                color: drop.highlight ? "#00ff00" : circleColor,
                fillColor: drop.highlight ? "#00ff00" : circleFill,
                fillOpacity: drop.highlight ? 0.2 : 0.1,
                weight: 1,
              }}
            />
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
