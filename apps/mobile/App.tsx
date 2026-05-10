import React, { useState, useEffect, useRef, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { Marker, Circle } from "./components/Map";
import { MobileWalletProvider } from "@wallet-ui/react-native-kit";
import { useLocation } from "./hooks/useLocation";
import { useClaimBounty } from "./hooks/useClaimBounty";
import { useDrops } from "./hooks/useDrops";
import { lamportsToSolString, type Drop } from "@geodrop/client";
import { lamports, type Account } from "@solana/kit";

const { width, height } = Dimensions.get("window");

function HunterApp() {
  console.log("[GeoDrop] HunterApp Render Start");
  const { location } = useLocation();
  const { drops, loading: loadingDrops } = useDrops();
  const { claimBounty, status } = useClaimBounty();

  useEffect(() => {
    console.log("[GeoDrop] HunterApp Mounted");
  }, []);

  const mapRef = useRef<MapView>(null);

  // Haversine formula for distance calculation in meters
  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) *
        Math.cos(lat2 * rad) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Find nearest drop and calculate distance
  const nearestDropInfo = useMemo(() => {
    if (!location || drops.length === 0) return null;

    let minDistance = Infinity;
    let closestDrop: Account<Drop> | null = null;

    drops.forEach((drop) => {
      const dropLat = Number(drop.data.latitude) / 1_000_000;
      const dropLng = Number(drop.data.longitude) / 1_000_000;

      const dist = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        dropLat,
        dropLng
      );

      if (dist < minDistance) {
        minDistance = dist;
        closestDrop = drop;
      }
    });

    return closestDrop ? { drop: closestDrop, distance: minDistance } : null;
  }, [location, drops]);

  const nearestDrop = nearestDropInfo?.drop as Account<Drop> | undefined;
  const distance = nearestDropInfo?.distance ?? null;
  const inRange =
    nearestDrop &&
    distance !== null &&
    distance <= Number(nearestDrop.data.radius);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>GEODROP // LIVE_RADAR</Text>
        <div style={styles.statusDot} />
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <View style={styles.webFallback}>
            <Text style={styles.loadingText}>
              MAP_VIEW_NOT_SUPPORTED_ON_WEB
            </Text>
            <Text style={[styles.loadingText, { marginTop: 10, fontSize: 10 }]}>
              PLEASE_USE_ANDROID_APK_FOR_FULL_EXPERIENCE
            </Text>
          </View>
        ) : location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={false}
            userInterfaceStyle="dark"
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            {drops.map((drop) => {
              const dropLat = Number(drop.data.latitude) / 1_000_000;
              const dropLng = Number(drop.data.longitude) / 1_000_000;
              const isNearest = nearestDrop?.address === drop.address;

              // Decode name
              const dropName = new TextDecoder()
                .decode(drop.data.name)
                .replace(/\0/g, "");

              return (
                <React.Fragment key={drop.address}>
                  <Marker
                    coordinate={{ latitude: dropLat, longitude: dropLng }}
                    title={dropName || "Unnamed Bounty"}
                    description={`Reward: ${lamportsToSolString(
                      lamports(drop.data.rewardPerClaim)
                    )} SOL | ${Number(drop.data.maxClaims) - Number(drop.data.currentClaims)} slots left`}
                    pinColor={isNearest ? "#6366f1" : "#a1a1aa"}
                  />
                  <Circle
                    center={{ latitude: dropLat, longitude: dropLng }}
                    radius={Number(drop.data.radius)}
                    fillColor={
                      isNearest && inRange
                        ? "rgba(0, 255, 0, 0.2)"
                        : "rgba(99, 102, 241, 0.1)"
                    }
                    strokeColor={
                      isNearest && inRange
                        ? "#00ff00"
                        : "rgba(99, 102, 241, 0.3)"
                    }
                    strokeWidth={1}
                  />
                </React.Fragment>
              );
            })}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>ACQUIRING_GPS_SIGNAL...</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>
          [ {nearestDrop ? "NEAREST_BOUNTY" : "SCANNING_AREA"} ]
        </Text>
        <Text
          style={[styles.distanceText, inRange && styles.distanceTextSuccess]}
        >
          {distance !== null ? `${distance.toFixed(1)}m` : "SEARCHING..."}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !inRange && styles.buttonDisabled]}
        disabled={!inRange || status === "claiming"}
        onPress={() => {
          if (nearestDrop && location) {
            claimBounty(
              nearestDrop.address,
              location.coords.latitude,
              location.coords.longitude
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          {status === "claiming"
            ? "SIGNING_ON_MWA..."
            : status === "success"
              ? "BOUNTY_CLAIMED!"
              : inRange
                ? "CLAIM_BOUNTY"
                : "OUT_OF_RANGE"}
        </Text>
      </TouchableOpacity>

      {loadingDrops && (
        <Text style={styles.syncText}>SYNCING_WITH_BLOCKCHAIN...</Text>
      )}
    </View>
  );
}

export default function App() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (e: any) => {
      console.error("[GeoDrop] Global Error:", e);
      setHasError(true);
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  if (hasError) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={{ color: "red", fontFamily: "monospace" }}>
          BOOT_CRITICAL_ERROR
        </Text>
        <Text style={{ color: "white", fontSize: 10, marginTop: 20 }}>
          Check browser console for logs.
        </Text>
      </View>
    );
  }

  return (
    <MobileWalletProvider
      cluster={{
        id: "solana:devnet",
        url: "https://api.devnet.solana.com",
      }}
      identity={{
        name: "GeoDrop",
        uri: "https://geodrop.xyz",
        icon: "favicon.png",
      }}
    >
      <HunterApp />
    </MobileWalletProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#6366f1",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00ff00",
  },
  mapContainer: {
    width: width - 40,
    height: height * 0.5,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    marginBottom: 30,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    padding: 20,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "monospace",
    fontSize: 12,
  },
  infoContainer: {
    width: "100%",
    alignItems: "center",
    gap: 5,
    marginBottom: 30,
  },
  label: {
    color: "rgba(255, 255, 255, 0.3)",
    fontFamily: "monospace",
    fontSize: 10,
    letterSpacing: 1,
  },
  distanceText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  distanceTextSuccess: {
    color: "#00ff00",
  },
  button: {
    width: "100%",
    height: 60,
    backgroundColor: "#6366f1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.02)",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "monospace",
    fontWeight: "bold",
    letterSpacing: 2,
    fontSize: 16,
  },
  syncText: {
    marginTop: 20,
    color: "rgba(99, 102, 241, 0.5)",
    fontFamily: "monospace",
    fontSize: 8,
    letterSpacing: 1,
  },
});
