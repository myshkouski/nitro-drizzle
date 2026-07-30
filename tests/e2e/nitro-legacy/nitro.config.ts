import { defineNitroConfig } from "nitropack/config";
import { pkgDir } from "nitro-drizzle/meta";
import { resolve } from "pathe";

export default defineNitroConfig({
  compatibilityDate: "2026-07-29",
  extends: [resolve(pkgDir, "fixtures/blog-api-legacy")],
});
