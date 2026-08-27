import { defineEventHandler } from "h3";
import { useDialect, type TransactionOf } from "nitro-drizzle/runtime";

export default defineEventHandler(async (event) => {
  await event.context.drizzle.waitReady();

  const { posts, comments } = await useDialect("content", async ({ datasource, dialect }) => {
    switch (dialect) {
      case "postgresql": {
        const { posts, comments } = await datasource.database.transaction(
          async (tx: TransactionOf<typeof datasource.database>) => {
            const [posts, comments] = await Promise.all([
              tx.select().from(datasource.schema.posts).limit(10),
              tx.select().from(datasource.schema.comments).limit(10),
            ]);

            return { posts, comments };
          },
        );

        return { posts, comments };
      }

      case "mysql": {
        const { posts, comments } = await datasource.database.transaction(async (tx) => {
          const [posts, comments] = await Promise.all([
            tx.select().from(datasource.schema.posts).limit(10),
            tx.select().from(datasource.schema.comments).limit(10),
          ]);
          return { posts, comments };
        });

        return { posts, comments };
      }

      case "sqlite": {
        const [posts, comments] = await Promise.all([
          datasource.database.query.posts
            .findMany({
              limit: 10,
              with: {
                comments: true,
              },
            })
            .execute(),
          datasource.database.select().from(datasource.schema.comments).limit(10),
        ]);

        return { posts, comments };
      }
    }
  });

  return {
    posts,
    comments,
  };
});
