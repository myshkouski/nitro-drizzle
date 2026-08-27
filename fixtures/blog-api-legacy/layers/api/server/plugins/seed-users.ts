import { defineNitroPlugin } from "nitropack/runtime";
import { consola } from "consola";
import { colorize } from "consola/utils";
import { useDialect } from "nitro-drizzle/runtime";
import { onConflictDoNothing as sqliteOnConflictDoNothing } from "nitro-drizzle/dialects/sqlite";
import { onConflictDoNothing as pgOnConflictDoNothing } from "nitro-drizzle/dialects/postgresql";
import { onConflictDoNothing as mysqlOnConflictDoNothing } from "nitro-drizzle/dialects/mysql";
import { usePrimaryColumns } from "nitro-drizzle/utils";

import * as sampleData from "@nitro-drizzle/fixtures-sample-data/users";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:migrate:after", async (name) => {
    if (name !== "users") return;

    await seedUsers();
    consola.info("Seed completed:", colorize("yellow", name));
  });
});

async function seedUsers() {
  await useDialect("users", async ({ datasource, dialect }) => {
    switch (dialect) {
      case "postgresql":
        await pgOnConflictDoNothing(
          usePrimaryColumns(datasource.schema.authors),
          datasource.database.insert(datasource.schema.authors).values(sampleData.authors),
        );

        break;

      case "mysql":
        await mysqlOnConflictDoNothing(
          usePrimaryColumns(datasource.schema.authors),
          datasource.database.insert(datasource.schema.authors).values(sampleData.authors),
        );

        break;

      case "sqlite":
        await sqliteOnConflictDoNothing(
          usePrimaryColumns(datasource.schema.authors),
          datasource.database.insert(datasource.schema.authors).values(sampleData.authors),
        );

        break;
    }
  });
}
