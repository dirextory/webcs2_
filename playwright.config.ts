import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 40_000,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1100, height: 800 },
    launchOptions: { args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-webgl"] },
  },
});
