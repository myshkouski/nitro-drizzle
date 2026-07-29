import { defu } from "defu";
import type { Datasources } from ".";
import { useRuntimeConfig } from "#nitro-drizzle/runtime";

/**
 * Retrieves the runtime configuration for a specific datasource.
 * @template TName - The datasource name
 * @param name - The datasource name
 * @returns The driver name and driver-specific configuration
 */
export function useConfig<TName extends keyof Datasources & string>(name: TName) {
  const runtimeConfig = useRuntimeConfig();
  const config = runtimeConfig?.[name];
  const driver = config?.driver;
  if (!driver) {
    throw new Error(`No driver name provided for datasource "${name}".`);
  }

  return {
    driver,
    config: defu(config[driver], {}),
  };
}
