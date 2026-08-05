import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "mysql",
    schema: "./mysql/schema.ts",
    out: "./mysql/migrations",
    casing: "snake_case",
  },
  import.meta.url,
);
