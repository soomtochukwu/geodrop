"use client";

import { useEffect, useState } from "react";

export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

/**
 * Web counterpart of the mobile app's expo-location hook (hooks/useLocation.ts):
 * continuously watches the device position with high accuracy.
 */
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("GEOLOCATION_NOT_SUPPORTED");
      return;
    }

    let watchId: number;

    const startWatch = (highAccuracy: boolean) => {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setError(null);
        },
        (err) => {
          if (highAccuracy && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
            console.warn("[GeoDrop] High accuracy GPS failed/timed out, falling back to network-based location.");
            navigator.geolocation.clearWatch(watchId);
            startWatch(false);
            return;
          }
          setError(
            err.code === err.PERMISSION_DENIED
              ? "LOCATION_PERMISSION_DENIED"
              : "LOCATION_UNAVAILABLE"
          );
        },
        {
          enableHighAccuracy: highAccuracy,
          maximumAge: highAccuracy ? 5000 : 10000,
          timeout: highAccuracy ? 10000 : 20000,
        }
      );
    };

    startWatch(true);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, error };
}
