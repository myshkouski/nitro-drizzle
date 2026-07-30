import { afterAll, beforeAll, describe } from "vitest";
import { buildLegacyNitro } from "./nitro-legacy";
import { setupNitroTest } from "./setup-test";
import { buildNitro } from "./nitro";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { MySqlContainer } from "@testcontainers/mysql";
import type { StartedTestContainer } from "testcontainers";
import type { ConfigOf } from "nitro-drizzle/runtime";
import { hash } from "ohash";

type TestCase = {
  driver: "postgresql" | "mysql" | "pglite" | "sqlite" | "d1";
  preset?: "cloudflare-module" | "node-listener";
  meta?: Record<string, any>;
  connector?: () => Promise<{ container: StartedTestContainer; config: object }>;
};

const testCases: TestCase[] = [
  {
    driver: "sqlite",
    meta: {
      dialect: "SQLiteSyncDialect",
      database: "BetterSQLite3Database",
      drivers: ["sqlite"],
    },
  },
  {
    driver: "pglite",
    meta: {
      dialect: "PgDialect",
      database: "PgliteDatabase",
      drivers: ["pglite"],
    },
  },
  {
    driver: "postgresql",
    async connector() {
      const container = await new PostgreSqlContainer("postgres:18-alpine").start();
      const config: ConfigOf<typeof import("nitro-drizzle/drivers/postgresql").default> = {
        url: container.getConnectionUri(),
      };
      return { container, config };
    },
    meta: {
      dialect: "PgDialect",
      database: "PostgresJsDatabase",
      drivers: ["postgresql"],
    },
  },
  {
    driver: "mysql",
    async connector() {
      const container = await new MySqlContainer("mysql:9").start();
      const config: ConfigOf<typeof import("nitro-drizzle/drivers/mysql").default> = {
        url: container.getConnectionUri(),
      };
      return { container, config };
    },
    meta: {
      dialect: "MySqlDialect",
      database: "MySql2Database",
      drivers: ["mysql"],
    },
  },
  {
    driver: "d1",
    preset: "cloudflare-module",
    meta: {
      // dialect: "unknown",
      database: "DrizzleD1Database",
      drivers: ["d1"],
    },
  },
];

const nitroRootDir = "tests/e2e/nitro-legacy";

describe("legacy nitro", async () => {
  describe.each(testCases)("driver: $driver", (testCase) => {
    const { driver, preset, connector, meta } = testCase;
    let container: StartedTestContainer | null;
    let runtimeDriverConfig: any | undefined;

    beforeAll(async () => {
      if (connector) {
        const db = await connector();
        container = db.container;
        runtimeDriverConfig = db.config;
      }
    }, 120_000);

    afterAll(async () => {
      await container?.stop();
    });

    setupNitroTest({
      meta,
      async createListener() {
        const configHash = hash(testCase);
        const driversToInclude = {
          drivers: { [driver]: true },
        };
        return await buildLegacyNitro(nitroRootDir, `.output/test/${driver}-${configHash}`, {
          preset,
          runtimeConfig: {
            drizzle: {
              content: {
                driver,
                [driver]: runtimeDriverConfig,
              },
              users: {
                driver,
                [driver]: runtimeDriverConfig,
              },
            },
          },
          drizzle: {
            datasources: {
              content: {
                ...driversToInclude,
              },
              users: {
                ...driversToInclude,
              },
            },
          },
        });
      },
    });
  });
});

describe("nitro", { skip: true }, () => {
  setupNitroTest({
    async createListener() {
      return await buildNitro(nitroRootDir);
    },
  });
});
