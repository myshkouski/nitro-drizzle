import { useDialect } from "nitro-drizzle/runtime";

export default defineEventHandler(async (event) => {
  await event.context.drizzle.waitReady();

  const { authors } = await useDialect("users", {
    async sqlite({ database, schema }) {
      return {
        authors: await database.select().from(schema.authors).limit(10),
      };
    },
    async mysql({ database, schema }) {
      return {
        authors: await database.select().from(schema.authors).limit(10),
      };
    },
    async postgresql({ database, schema }) {
      return {
        authors: await database.select().from(schema.authors).limit(10),
      };
    },
  });

  return {
    authors,
  };
});
