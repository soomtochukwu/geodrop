import { useState, useEffect } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      // Mock location for web testing
      setLocation({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      return;
    }

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        // Subscribe to location updates
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1, // update every 1 meter
          },
          (newLoc) => {
            setLocation(newLoc);
          }
        );

        return () => subscription.remove();
      } catch (e) {
        console.error("Location error:", e);
        setErrorMsg("Failed to initialize location");
      }
    })();
  }, []);

  return { location, errorMsg };
};
