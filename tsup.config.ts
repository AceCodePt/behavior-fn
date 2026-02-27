import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  clean: true,
  target: "node20",
  platform: "node",
  external: ["jiti"], // Keep jiti external - it has dynamic requires that break when bundled
  onSuccess: "cp -r registry dist/ && chmod +x dist/index.js",
});
