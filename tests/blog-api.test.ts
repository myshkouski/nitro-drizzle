import { afterAll, beforeAll, describe } from "vitest";
import { buildLegacyNitro } from "./nitro-legacy";
import { setupNitroTest } from "./setup";
import { buildNitro } from "./nitro";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { MySqlContainer } from "@testcontainers/mysql";
import type { StartedTestContainer } from "testcontainers";
import type { ConfigOf } from "nitro-drizzle/runtime";

type TestCase = {
  driver: string;
  meta?: Record<string, any>;
  connector?: () => Promise<{ container: StartedTestContainer; config: object }>;
};

const testCases: TestCase[] = [
  {
    driver: "sqlite",
    meta: {
      dialect: "SQLiteSyncDialect",
      database: "BetterSQLite3Database",
    },
  },
  {
    driver: "pglite",
    meta: {
      dialect: "PgDialect",
      database: "PgliteDatabase",
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
    },
  },
];

describe("legacy nitro", async () => {
  describe.each(testCases)("driver: $driver", ({ driver, connector, meta }) => {
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
      if (container) {
        await container.stop();
        container = null;
      }
    });

    setupNitroTest({
      meta,
      async listener() {
        const runtimeConfig = {
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
        };
        return await buildLegacyNitro("fixtures/blog-api-legacy", `.output/test/${driver}`, {
          runtimeConfig,
        });
      },
    });
  });
});

describe("nitro", { skip: true }, () => {
  setupNitroTest({
    listener() {
      return buildNitro("fixtures/blog-api");
    },
  });
});
