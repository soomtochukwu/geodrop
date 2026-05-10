import { Platform } from "react-native";
import { Buffer } from "buffer";

// Ensure Buffer is available globally
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

// Ensure process is available (some libraries expect process.env or process.nextTick)
if (typeof global.process === "undefined") {
  global.process = require("process");
}

// Polyfill for TextEncoder/Decoder if needed
import "fast-text-encoding";

// Crypto polyfill logic
if (Platform.OS !== "web") {
  // Use native quick-crypto for Android/iOS
  try {
    const { install } = require("react-native-quick-crypto");
    if (typeof install === "function") {
      install();
    }
  } catch (e) {
    console.warn("Native crypto install failed:", e);
  }
} else {
  // For web, use the browser's native crypto if available
  if (typeof global.crypto === "undefined") {
    // In very old browsers or non-secure contexts, we might need a shim
    // but usually modern browsers have global.crypto
  }
}
