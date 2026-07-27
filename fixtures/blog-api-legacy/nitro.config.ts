import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  debug: true,
  compatibilityDate: "latest",
  srcDir: "server",
  modules: ["nitro-drizzle"],
  experimental: {
    tasks: true,
  },
  runtimeConfig: {
    drizzle: {
      content: {
        driver: "sqlite",
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
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    wrangler: {
      // durable_objects: {
      //   bindings: [
      //     {
      //       name: "server",
      //       class_name: "$DurableObject",
      //     },
      //   ],
      // },
      d1_databases: [
        {
          database_name: "content",
          binding: "content",
        },
        {
          database_name: "users",
          binding: "users",
        },
      ],
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        verbatimModuleSyntax: true,
      },
    },
  },
});
