import { defineNitroConfig } from "nitropack/config";

type DrizzleDriverName = "postgresql" | "mysql" | "pglite" | "sqlite" | "d1";
const defaultDrizzleDrivers: DrizzleDriverName[] = [
  "postgresql",
  "mysql",
  "pglite",
  "sqlite",
  "d1",
];
const drizzleDrivers =
  (process.env.DRIZZLE_DRIVERS?.split(",") as DrizzleDriverName[]) ?? defaultDrizzleDrivers;

export default defineNitroConfig({
  compatibilityDate: "latest",
  srcDir: "server",
  modules: ["nitro-drizzle"],
  experimental: {
    tasks: true,
  },
  runtimeConfig: {
    drizzle: {
      content: {
        driver: "",
        mysql: {
          url: "",
        },
        postgresql: {
          url: "",
        },
        pglite: {
          dataDir: "memory://",
        },
        sqlite: {
          url: ":memory:",
        },
        d1: {
          binding: "content",
        },
      },
      users: {
        driver: "",
        mysql: {
          url: "",
        },
        postgresql: {
          url: "",
        },
        pglite: {
          dataDir: "memory://",
        },
        sqlite: {
          url: ":memory:",
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
        drivers: drizzleDrivers,
      },
      users: {
        drivers: drizzleDrivers,
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
      vars: {
        NITRO_DRIZZLE_CONTENT_DRIVER: "d1",
        NITRO_DRIZZLE_USERS_DRIVER: "d1",
      },
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
