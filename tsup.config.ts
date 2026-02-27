import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  clean: true,
  target: "node20",
  platform: "node",
  noExternal: ["jiti"],
  onSuccess: "cp -r registry dist/ && chmod +x dist/index.js",
});
