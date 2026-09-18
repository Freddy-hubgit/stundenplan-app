import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.freddy.stundenplan11bguti",
  appName: "Stundenplan 11BGUTI",
  webDir: "dist/demo",
  android: {
    allowMixedContent: true,
  },
};

export default config;
