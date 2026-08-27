import { defineNitroPlugin } from "nitropack/runtime";
import { consola } from "consola";
import { colorize } from "consola/utils";
import { useDialect } from "nitro-drizzle/runtime";
import { usePrimaryColumns } from "nitro-drizzle/utils";
import { onConflictDoNothing as sqliteOnConflictDoNothing } from "nitro-drizzle/dialects/sqlite";
import { onConflictDoNothing as pgOnConflictDoNothing } from "nitro-drizzle/dialects/postgresql";

import * as sampleData from "@nitro-drizzle/fixtures-sample-data/content";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:migrate:after", async (name) => {
    if (name !== "content") return;

    await seedContent();
    consola.info("Seed completed:", colorize("yellow", name));
  });
});

async function seedContent() {
  await useDialect("content", {
    async postgresql({ database, schema }) {
      await pgOnConflictDoNothing(
        usePrimaryColumns(schema.posts),
        database.insert(schema.posts).values(sampleData.posts),
      );

      await pgOnConflictDoNothing(
        usePrimaryColumns(schema.comments),
        database.insert(schema.comments).values(sampleData.comments),
      );
    },
    async sqlite({ database, schema }) {
      await sqliteOnConflictDoNothing(
        usePrimaryColumns(schema.posts),
        database.insert(schema.posts).values(sampleData.posts),
      );

      await sqliteOnConflictDoNothing(
        usePrimaryColumns(schema.comments),
        database.insert(schema.comments).values(sampleData.comments),
      );
    },
  });
}
