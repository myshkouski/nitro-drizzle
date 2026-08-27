import { defineNitroConfig } from "nitropack/config";
import { resolve } from "pathe";

type DrizzleDriverName = "postgresql" | "mysql" | "pglite" | "sqlite" | "d1";
const defaultDrizzleDrivers: (DrizzleDriverName | `_${DrizzleDriverName}`)[] = [
  "_postgresql",
  "_mysql",
  "_pglite",
  "_sqlite",
  "_d1",
];
const drizzleDrivers = [
  ...defaultDrizzleDrivers,
  ...((process.env.DRIZZLE_DRIVERS?.split(",") as DrizzleDriverName[]) ?? []),
];

export const serverDir = resolve(import.meta.dirname, "server");
export const drizzleDir = resolve(serverDir, "db/drizzle");

export default defineNitroConfig({
  compatibilityDate: "latest",
  // use absolute path to support config layers
  srcDir: serverDir,
  modules: ["nitro-drizzle"],
  imports: false,
  experimental: {
    tasks: true,
  },
  runtimeConfig: {
    drizzle: {
      content: {
        driver: "",
      },
      users: {
        driver: "",
      },
      // @ts-expect-error
      unknown: {},
    },
  },
  drizzle: {
    // use absolute path to support config layers
    baseDir: drizzleDir,
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
});
