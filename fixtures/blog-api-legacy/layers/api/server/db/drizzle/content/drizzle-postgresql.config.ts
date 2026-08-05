import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "postgresql",
    schema: ["./postgresql/schema/posts.ts", "./postgresql/schema/comments.ts"],
    out: "./postgresql/migrations",
    casing: "snake_case",
    migrations: {
      /**
       * This resolves issues when both "content" and "users" migration scripts try to create the same "drizzle" schema in the same remote database.
       * @todo Fix the migration logic and do not allow to run multiple migrations at the same time on the same database.
       */
      schema: "content_drizzle",
    },
  },
  import.meta.url,
);
