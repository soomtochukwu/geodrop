import { install } from "react-native-quick-crypto";
import { Buffer } from "buffer";

// Install crypto polyfills
if (typeof install === "function") {
  install();
}

// Ensure Buffer is available globally
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

// Polyfill for TextEncoder/Decoder if needed
import "fast-text-encoding";
