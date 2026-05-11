import { defineConfig } from "tsdown";

export default defineConfig({
  attw: true,
  clean: true,
  dts: true,
  entry: [
    "src/index.ts",
    "src/openapi/index.ts",
    "src/middleware/index.ts",
  ],
  format: ["cjs", "esm"],
  publint: true,
  tsconfig: "tsconfig.build.json",
});
