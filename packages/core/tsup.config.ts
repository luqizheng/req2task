import { defineConfig } from "tsup";

export const baseTsupConfig = defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    dts: true,
    splitting: false,
    clean: true,
    outDir: "dist",
    external: [
      "@nestjs/common",
      "@nestjs/core",
      "@nestjs/microservices",
      "@nestjs/typeorm",
      "@nestjs/config",
      "@nestjs/swagger",
      "@nestjs/platform-express",
      "class-transformer",
      "class-validator",
      "typeorm",
    ],
  },
]);

export default baseTsupConfig;
