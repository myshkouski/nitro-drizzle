import { createJiti, type Jiti, type JitiOptions } from "jiti";
import type { Resolver } from "nitro-drizzle/context";
import { fileURLToPath } from "url";

/**
 * Creates a module resolver using jiti.
 * @param id - The base module ID for resolution
 * @param options - Optional resolver configuration
 * @returns A Resolver instance
 */
export function createResolver(id: string, options?: { alias?: Record<string, string> }): Resolver {
  return new JitiResolver(id, {
    alias: options?.alias,
  });
}

class JitiResolver implements Resolver {
  readonly #jiti: Jiti;

  constructor(id: string, options?: JitiOptions) {
    this.#jiti = createJiti(id, options);
  }

  resolve(id: string): string {
    return fileURLToPath(this.#jiti.esmResolve(id));
  }
}
