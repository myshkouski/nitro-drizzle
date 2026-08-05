import { defineEventHandler } from "h3";
import { useDialect } from "nitro-drizzle/runtime";

export default defineEventHandler(async (event) => {
  await event.context.drizzle.waitReady();

  const { posts, comments } = await useDialect("content", {
    async postgresql({ database, schema }) {
      const { posts, comments } = await database.transaction(async (tx) => {
        const [posts, comments] = await Promise.all([
          tx.select().from(schema.posts).limit(10),
          tx.select().from(schema.comments).limit(10),
        ]);
        return { posts, comments };
      });

      return { posts, comments };
    },
    async mysql({ database, schema }) {
      const { posts, comments } = await database.transaction(async (tx) => {
        const [posts, comments] = await Promise.all([
          tx.select().from(schema.posts).limit(10),
          tx.select().from(schema.comments).limit(10),
        ]);
        return { posts, comments };
      });

      return { posts, comments };
    },
    async sqlite({ database, schema }) {
      const [posts, comments] = await Promise.all([
        database.query.posts
          .findMany({
            limit: 10,
            with: {
              comments: true,
            },
          })
          .execute(),
        database.select().from(schema.comments).limit(10),
      ]);

      return { posts, comments };
    },
  });

  return {
    posts,
    comments,
  };
});
