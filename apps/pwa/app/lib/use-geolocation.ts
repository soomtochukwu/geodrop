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
  const [isMock, setIsMock] = useState(false);

  const toggleMock = () => {
    if (isMock) {
      setIsMock(false);
      setPosition(null);
    } else {
      setIsMock(true);
      setPosition({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      });
      setError(null);
    }
  };

  useEffect(() => {
    if (isMock) return;

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("GEOLOCATION_NOT_SUPPORTED");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "LOCATION_PERMISSION_DENIED"
            : "LOCATION_UNAVAILABLE"
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isMock]);

  return { position, error, isMock, toggleMock, setPosition };
}
