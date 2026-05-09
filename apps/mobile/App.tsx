import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { MobileWalletProvider } from "@wallet-ui/react-native-kit";
import { useLocation } from "./hooks/useLocation";
import { useClaimBounty } from "./hooks/useClaimBounty";

const { width, height } = Dimensions.get("window");

// Mock drop data for the MVP
const MOCK_DROP = {
  address: "4ysUbXcRMXJkmTx6y7ek34aDLkakG7ihpgZ4VEzXGmko", // Replace with real drop PDA when fetched
  latitude: 37.7749, // Will be overridden by nearby user location
  longitude: -122.4194,
  radius: 50, // meters
  bounty: "1.0 SOL",
};

function HunterApp() {
  const { location } = useLocation();
  const { claimBounty, status } = useClaimBounty();
  const [distance, setDistance] = useState<number | null>(null);
  const [dropLocation, setDropLocation] = useState({
    latitude: MOCK_DROP.latitude,
    longitude: MOCK_DROP.longitude,
  });

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

  useEffect(() => {
    if (location && distance === null) {
      // For the MVP demo, place the drop exactly 30 meters north of the user's initial location
      // 1 degree latitude is approx 111,111 meters. 30 meters = 0.00027 degrees
      const targetLat = location.coords.latitude + 0.00027;
      const targetLng = location.coords.longitude;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDropLocation({ latitude: targetLat, longitude: targetLng });

      // Calculate initial distance
      const dist = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        targetLat,
        targetLng
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDistance(dist);

      // Animate map to show both user and drop
      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude + 0.000135, // Center between user and drop
          longitude: location.coords.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000
      );
    } else if (location && dropLocation) {
      // Update distance as user moves
      const dist = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        dropLocation.latitude,
        dropLocation.longitude
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDistance(dist);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const inRange = distance !== null && distance <= MOCK_DROP.radius;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>GEODROP // MAP_VIEW</Text>
        <View style={styles.statusDot} />
      </View>

      <View style={styles.mapContainer}>
        {location ? (
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
            {/* The Drop Marker */}
            <Marker
              coordinate={dropLocation}
              title="Solana Bounty"
              description={MOCK_DROP.bounty}
              pinColor="#6366f1"
            />
            {/* The Drop Radius */}
            <Circle
              center={dropLocation}
              radius={MOCK_DROP.radius}
              fillColor={
                inRange ? "rgba(0, 255, 0, 0.2)" : "rgba(99, 102, 241, 0.2)"
              }
              strokeColor={inRange ? "#00ff00" : "#6366f1"}
              strokeWidth={2}
            />
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>ACQUIRING_GPS_SIGNAL...</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>[ TARGET_DISTANCE ]</Text>
        <Text
          style={[styles.distanceText, inRange && styles.distanceTextSuccess]}
        >
          {distance !== null ? `${distance.toFixed(1)}m` : "SEARCHING..."}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !inRange && styles.buttonDisabled]}
        disabled={!inRange || status === "claiming"}
        onPress={() => claimBounty(MOCK_DROP.address)}
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
    </View>
  );
}

export default function App() {
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
});
