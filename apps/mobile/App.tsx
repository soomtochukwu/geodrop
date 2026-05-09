import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { MobileWalletProvider } from "@wallet-ui/react-native-kit";
import { useLocation } from "./hooks/useLocation";
import { useClaimBounty } from "./hooks/useClaimBounty";

const { width } = Dimensions.get("window");

function HunterApp() {
  const { location } = useLocation();
  const { claimBounty, status } = useClaimBounty();
  const [distance, setDistance] = useState<number | null>(null);

  const radius = 50; // 50 meters
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (location && distance === null) {
      // Mock calculation: as if we are moving towards the drop
      // Using a small delay to avoid "setState synchronously in effect" warning
      const timer = setTimeout(() => {
        setDistance(12.5);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location, distance]);

  const inRange = distance !== null && distance <= radius;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>GEODROP // HUNTER_v1.0</Text>
        <View style={styles.statusDot} />
      </View>

      <View style={styles.radarContainer}>
        <Animated.View
          style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
        />
        <View style={styles.radarCenter}>
          <View style={styles.userDot} />
        </View>

        <View style={[styles.radarLine, { transform: [{ rotate: "0deg" }] }]} />
        <View
          style={[styles.radarLine, { transform: [{ rotate: "45deg" }] }]}
        />
        <View
          style={[styles.radarLine, { transform: [{ rotate: "90deg" }] }]}
        />
        <View
          style={[styles.radarLine, { transform: [{ rotate: "135deg" }] }]}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>[ TARGET_DISTANCE ]</Text>
        <Text style={styles.distanceText}>
          {distance !== null ? `${distance.toFixed(1)}m` : "SEARCHING..."}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>[ COORDINATES ]</Text>
        <Text style={styles.coordsText}>
          {location
            ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
            : "0.000000, 0.000000"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, !inRange && styles.buttonDisabled]}
        disabled={!inRange || status === "claiming"}
        onPress={() =>
          claimBounty("4ysUbXcRMXJkmTx6y7ek34aDLkakG7ihpgZ4VEzXGmko")
        }
      >
        <Text style={styles.buttonText}>
          {status === "claiming"
            ? "INITIALIZING_MWA..."
            : status === "success"
              ? "CLAIMED_SUCCESS"
              : inRange
                ? "CLAIM_DROP"
                : "OUT_OF_RANGE"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>SECURE_LOCATION_VERIFICATION_ACTIVE</Text>
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
    paddingHorizontal: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
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
  radarContainer: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.1)",
  },
  radarCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  radarLine: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  infoContainer: {
    width: "100%",
    gap: 10,
    marginBottom: 40,
  },
  label: {
    color: "rgba(255, 255, 255, 0.3)",
    fontFamily: "monospace",
    fontSize: 10,
    letterSpacing: 1,
  },
  distanceText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  coordsText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "monospace",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 10,
  },
  button: {
    width: "100%",
    height: 60,
    backgroundColor: "#6366f1",
    borderRadius: 4,
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
    fontSize: 14,
  },
  footerText: {
    position: "absolute",
    bottom: 40,
    color: "rgba(99, 102, 241, 0.3)",
    fontFamily: "monospace",
    fontSize: 8,
    letterSpacing: 1,
  },
});
