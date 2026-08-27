import { defineEventHandler } from "h3";
import { useDialect } from "nitro-drizzle/runtime";

export default defineEventHandler(async (event) => {
  await event.context.drizzle.waitReady();

  const { authors } = await useDialect("users", async ({ datasource, dialect }) => {
    switch (dialect) {
      case "sqlite":
        return {
          authors: await datasource.database.select().from(datasource.schema.authors).limit(10),
        };

      case "mysql":
        return {
          authors: await datasource.database.select().from(datasource.schema.authors).limit(10),
        };

      case "postgresql":
        return {
          authors: await datasource.database.select().from(datasource.schema.authors).limit(10),
        };
    }
  });

  return {
    authors,
  };
});
