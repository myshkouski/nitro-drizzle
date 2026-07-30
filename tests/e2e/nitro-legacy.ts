import { resolve } from "pathe";
import { listen } from "listhen";
import {
  build,
  copyPublicAssets,
  createNitro,
  prepare,
  prerender,
  type NitroConfig,
} from "nitropack";
import { pkgDir } from "nitro-drizzle/meta";
import { createTestHarness } from "wrangler";
import type { Listener } from "./setup-test";
import { defu } from "defu";

export async function buildLegacyNitro(
  dir: string,
  outDir: string,
  config?: Omit<NitroConfig, "rootDir" | "output">,
): Promise<Listener> {
  const rootDir = resolve(pkgDir, dir);
  const preset = config?.preset ?? "node-listener";
  const nitro = await createNitro(
    defu(
      {
        rootDir,
        output: {
          dir: resolve(pkgDir, dir, outDir),
        },
        preset,
      },
      config,
    ),
  );

  await prepare(nitro);
  await copyPublicAssets(nitro);
  await prerender(nitro);
  await build(nitro);

  const serverDir = nitro.options.output.serverDir;

  if (preset.startsWith("cloudflare")) {
    const configPath = resolve(serverDir, "wrangler.json");
    const harness = createTestHarness({
      workers: [{ configPath }],
    });
    const listener = await harness.listen();
    return {
      url: listener.url,
      async close() {
        await harness.close();
      },
    };
  }

  const entryPath = resolve(serverDir, "index.mjs");
  const { listener: serverHandler } = await import(entryPath);
  const listener = await listen(serverHandler);

  return {
    url: listener.url,
    async close() {
      await listener.close();
    },
  };
}
