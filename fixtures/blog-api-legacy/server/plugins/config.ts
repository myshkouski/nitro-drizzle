import { defineNitroPlugin } from "nitropack/runtime";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:config", async (_name, driver, config) => {
    switch (driver) {
      case "postgresql":
        config.debug = true;
        break;
      // case "mysql":
      //   break;
      case "sqlite":
        config.verbose = console.debug;
        break;
      case "pglite":
        config.debug = 0;
        break;
    }
  });
});
