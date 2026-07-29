import type { Nitro as LegacyNitro } from "nitropack/types";
import type { Nitro } from "nitro/types";

/**
 * Checks if the given Nitro instance is using the legacy API (nitropack).
 * @param nitro - The Nitro instance to check
 * @returns `true` if the Nitro instance is legacy (major version < 3)
 */
export function isLegacy(nitro: Nitro | LegacyNitro): nitro is LegacyNitro {
  return nitro.meta.majorVersion < 3;
}
