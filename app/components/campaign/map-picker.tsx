"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import { Navigation } from "lucide-react";

// Fix for Leaflet default icon issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}

function SearchField({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
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
      searchLabel: "Enter_Address...",
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result: any) => {
      onLocationChange(result.location.y, result.location.x);
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, onLocationChange]);

  return null;
}

function MapControls({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  const handleLocate = () => {
    map.locate().on("locationfound", (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    }).on("locationerror", (err) => {
      console.warn("Location access failed:", err.message);
      // Fallback to San Francisco center
      onLocationChange(37.7749, -122.4194);
      map.flyTo([37.7749, -122.4194], map.getZoom());
    });
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <button
        onClick={(e) => {
          e.preventDefault();
          handleLocate();
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background/80 text-white backdrop-blur-md transition hover:bg-indigo-500 hover:text-white shadow-xl"
        title="Locate Me"
      >
        <Navigation className="h-4 w-4" />
      </button>
    </div>
  );
}

function LocationMarker({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return (
    <Marker
      position={[lat, lng]}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onLocationChange(position.lat, position.lng);
        },
      }}
    />
  );
}

export default function MapPicker({
  lat,
  lng,
  radius,
  onLocationChange,
}: MapPickerProps) {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 relative">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Circle
          center={[lat, lng]}
          radius={radius}
          pathOptions={{
            color: "#6366f1",
            fillColor: "#6366f1",
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
        <LocationMarker
          lat={lat}
          lng={lng}
          onLocationChange={onLocationChange}
        />
        <SearchField onLocationChange={onLocationChange} />
        <MapControls onLocationChange={onLocationChange} />
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-background/80 backdrop-blur-md border border-white/10 rounded-lg p-2 text-[10px] font-mono text-muted-foreground shadow-xl">
          <p>LAT: {lat.toFixed(6)}</p>
          <p>LNG: {lng.toFixed(6)}</p>
        </div>
      </div>
    </div>
  );
}
