import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.redhook.cadsagri",
  appName: "CADS-Agri",
  webDir: "dist",

  // ✅ Load the deployed PROD web app inside iOS
  server: {
    url: "https://cads-agri-demo.vercel.app",
    cleartext: true,
  },
};

export default config;
