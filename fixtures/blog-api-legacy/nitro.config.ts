export default defineNitroConfig({
  compatibilityDate: "latest",
  extends: "./layers/api",
  imports: false,
  runtimeConfig: {
    drizzle: {
      content: {
        driver: "",
        mysql: {
          url: "",
        },
        postgresql: {
          url: "",
        },
        pglite: {
          dataDir: "memory://",
        },
        sqlite: {
          url: ":memory:",
        },
        d1: {
          binding: "content",
        },
      },
      users: {
        driver: "",
        mysql: {
          url: "",
        },
        postgresql: {
          url: "",
        },
        pglite: {
          dataDir: "memory://",
        },
        sqlite: {
          url: ":memory:",
        },
        d1: {
          binding: "users",
        },
      },
      // @ts-expect-error
      unknown: {},
    },
  },
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    wrangler: {
      // durable_objects: {
      //   bindings: [
      //     {
      //       name: "server",
      //       class_name: "$DurableObject",
      //     },
      //   ],
      // },
      vars: {
        NITRO_DRIZZLE_CONTENT_DRIVER: "d1",
        NITRO_DRIZZLE_USERS_DRIVER: "d1",
      },
      d1_databases: [
        {
          database_name: "content",
          binding: "content",
        },
        {
          database_name: "users",
          binding: "users",
        },
      ],
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        verbatimModuleSyntax: true,
      },
    },
  },
});
