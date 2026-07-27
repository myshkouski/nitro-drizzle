import { defu } from "defu";
import type { Datasources } from ".";
import { useRuntimeConfig } from "#nitro-drizzle/runtime";

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
