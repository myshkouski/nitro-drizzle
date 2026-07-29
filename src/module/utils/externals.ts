import type { NitroOptions as LegacyNitroOptions } from "nitropack/types";
import type { NitroOptions } from "nitro/types";

/**
 * Adds module IDs to the inline externals list for legacy Nitro.
 * @param nitroOptions - The legacy Nitro options
 * @param moduleIds - The module IDs to add as inline externals
 */
export function addInlineExternals(nitroOptions: LegacyNitroOptions, moduleIds: readonly string[]) {
  // @ts-expect-error
  nitroOptions.externals ||= {};
  nitroOptions.externals.inline ||= [];
  nitroOptions.externals.inline.push(...moduleIds);
}

/**
 * Adds module IDs to the no-externals list for modern Nitro.
 * @param nitroOptions - The Nitro options
 * @param moduleIds - The module IDs to exclude from externals
 */
export function addNoExternals(nitroOptions: NitroOptions, moduleIds: readonly string[]) {
  if (true === nitroOptions.noExternals) {
    return;
  }
  nitroOptions.noExternals ||= [];
  nitroOptions.noExternals.push(...moduleIds);
}
