import type { RollupConfig as NitropackRollupConfig } from "nitropack/types";
import type { RollupConfig } from "nitro/types";
import type { Plugin } from "rollup";

/**
 * Adds a Rollup plugin to the Nitro rollup configuration.
 * @param rollupConfig - The Rollup configuration
 * @param plugin - The Rollup plugin to add
 */
export async function addPlugin(
  rollupConfig: RollupConfig | NitropackRollupConfig,
  plugin: Plugin,
) {
  const plugins = [await rollupConfig.plugins].flat();
  rollupConfig.plugins = [...plugins, plugin];
}
