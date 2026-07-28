import { describe } from "vitest";
import { buildLegacyNitro } from "./nitro-legacy";
import { setupNitroTest } from "./setup";
import { buildNitro } from "./nitro";
import type { StartedTestContainer } from "testcontainers";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { ConfigOf } from "nitro-drizzle/runtime";
import { MySqlContainer } from "@testcontainers/mysql";

const testCases = [
  { driver: "sqlite" },
  { driver: "pglite" },
  {
    driver: "postgresql",
    createDb: async () => {
      const container = await new PostgreSqlContainer("postgres:18-alpine").start();
      const config: ConfigOf<typeof import("nitro-drizzle/drivers/postgresql").default> = {
        url: container.getConnectionUri(),
      };
      return { container, config };
    },
  },
  {
    driver: "mysql",
    createDb: async () => {
      const container = await new MySqlContainer("mysql:9").start();
      const config: ConfigOf<typeof import("nitro-drizzle/drivers/mysql").default> = {
        url: container.getConnectionUri(),
      };
      return { container, config };
    },
  },
];

describe("legacy nitro", async ({ describe }) => {
  testCases.forEach(({ driver, createDb }) => {
    describe(driver, ({ beforeEach, afterEach }) => {
      let container: StartedTestContainer | undefined;
      let runtimeDriverConfig: any | undefined;

      beforeEach(async () => {
        if (createDb) {
          const db = await createDb();
          container = db.container;
          runtimeDriverConfig = db.config;
        }
      }, 120_000);

      afterEach(async () => {
        await container?.stop();
      });

      setupNitroTest(() => {
        const runtimeConfig = {
          drizzle: {
            content: {
              driver,
            },
            users: {
              driver,
              [driver]: runtimeDriverConfig,
            },
          },
        };
        return buildLegacyNitro("fixtures/blog-api-legacy", { runtimeConfig });
      });
    });
  });
});

describe("nitro", { skip: true }, async () => {
  setupNitroTest(() => buildNitro("fixtures/blog-api"));
});
