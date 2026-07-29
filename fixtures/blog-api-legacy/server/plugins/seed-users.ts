import { defineNitroPlugin } from "nitropack/runtime";
import { consola } from "consola";
import { colorize } from "consola/utils";
import { useDialect } from "nitro-drizzle/runtime";
import { onConflictDoNothing as sqliteOnConflictDoNothing } from "nitro-drizzle/dialects/sqlite";
import { onConflictDoNothing as pgOnConflictDoNothing } from "nitro-drizzle/dialects/postgresql";
import { onConflictDoNothing as mysqlOnConflictDoNothing } from "nitro-drizzle/dialects/mysql";
import { usePrimaryColumns } from "nitro-drizzle/utils";

import * as sampleData from "nitro-drizzle-sample-data/users";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:migrate:after", async (name) => {
    if (name !== "users") return;

    await seedUsers();
    consola.info("Seed completed:", colorize("greenBright", name));
  });
});

async function seedUsers() {
  await useDialect("users", {
    async postgresql({ database, schema }) {
      await pgOnConflictDoNothing(
        usePrimaryColumns(schema.authors),
        database.insert(schema.authors).values(sampleData.authors),
      );
    },

    async mysql({ database, schema }) {
      await mysqlOnConflictDoNothing(
        usePrimaryColumns(schema.authors),
        database.insert(schema.authors).values(sampleData.authors),
      );
    },

    async sqlite({ database, schema }) {
      await sqliteOnConflictDoNothing(
        usePrimaryColumns(schema.authors),
        database.insert(schema.authors).values(sampleData.authors),
      );
    },
  });
}
