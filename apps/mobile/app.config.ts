import appJson from "./app.json";

type AndroidConfig = typeof appJson.expo.android & {
  config?: {
    googleMaps?: {
      apiKey?: string;
    };
  };
};

const androidConfig = appJson.expo.android as AndroidConfig;
const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  "";

const config = {
  ...appJson.expo,
  android: {
    ...androidConfig,
    config: {
      ...androidConfig.config,
      googleMaps: {
        ...androidConfig.config?.googleMaps,
        apiKey: googleMapsApiKey,
      },
    },
  },
};

export default config;
