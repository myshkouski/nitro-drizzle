import { defineConfig } from "nitro";

export default defineConfig({
  debug: true,
  serverDir: "./server",
  renderer: false,
  modules: ["nitro-drizzle"],
  runtimeConfig: {
    drizzle: {
      content: {
        driver: "",
        sqlite: {
          url: ":memory:",
        },
        d1: {
          binding: "content",
        },
      },
      users: {
        driver: "sqlite",
        postgresql: {
          url: "",
        },
        pglite: {
          dataDir: "memory://",
        },
        d1: {
          binding: "users",
        },
      },
      // @ts-expect-error
      unknown: {},
    },
  },
  drizzle: {
    baseDir: "~/db/drizzle",
    migrations: {
      migrateOnInit: true,
    },
    datasources: {
      content: {
        drivers: ["postgresql", "pglite", "sqlite", "d1"],
      },
      users: {
        drivers: ["postgresql", "pglite", "sqlite", "d1"],
      },
    },
    // @ts-expect-error
    unknownModuleOptions: {},
  },
  typescript: {
    generateRuntimeConfigTypes: true,
    generateTsConfig: true,
  },
});
