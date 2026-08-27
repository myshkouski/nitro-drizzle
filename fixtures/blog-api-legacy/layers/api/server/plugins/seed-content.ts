import { defineNitroPlugin } from "nitropack/runtime";
import { consola } from "consola";
import { colorize } from "consola/utils";
import { useDialect, type TransactionOf } from "nitro-drizzle/runtime";
import { usePrimaryColumns } from "nitro-drizzle/utils";
import { onConflictDoNothing as sqliteOnConflictDoNothing } from "nitro-drizzle/dialects/sqlite";
import { onConflictDoNothing as pgOnConflictDoNothing } from "nitro-drizzle/dialects/postgresql";
import { onConflictDoNothing as mysqlOnConflictDoNothing } from "nitro-drizzle/dialects/mysql";

import * as sampleData from "@nitro-drizzle/fixtures-sample-data/content";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:migrate:after", async (name) => {
    if (name !== "content") return;

    await seedContent();
    consola.info("Seed completed:", colorize("yellow", name));
  });
});

async function seedContent() {
  await useDialect("content", async ({ datasource, dialect }) => {
    switch (dialect) {
      case "postgresql":
        await datasource.database.transaction(
          async (tx: TransactionOf<typeof datasource.database>) => {
            await pgOnConflictDoNothing(
              usePrimaryColumns(datasource.schema.posts),
              tx.insert(datasource.schema.posts).values(sampleData.posts),
            );

            await pgOnConflictDoNothing(
              usePrimaryColumns(datasource.schema.comments),
              tx.insert(datasource.schema.comments).values(sampleData.comments),
            );
          },
        );

        break;

      case "mysql":
        await datasource.database.transaction(async (tx) => {
          await mysqlOnConflictDoNothing(
            usePrimaryColumns(datasource.schema.posts),
            tx.insert(datasource.schema.posts).values(sampleData.posts),
          );

          await mysqlOnConflictDoNothing(
            usePrimaryColumns(datasource.schema.comments),
            tx.insert(datasource.schema.comments).values(sampleData.comments),
          );
        });

        break;

      case "sqlite":
        await sqliteOnConflictDoNothing(
          usePrimaryColumns(datasource.schema.posts),
          datasource.database.insert(datasource.schema.posts).values(sampleData.posts),
        );

        await sqliteOnConflictDoNothing(
          usePrimaryColumns(datasource.schema.comments),
          datasource.database.insert(datasource.schema.comments).values(sampleData.comments),
        );

        break;
    }
  });
}
