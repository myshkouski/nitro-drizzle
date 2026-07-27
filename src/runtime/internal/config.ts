import { type Datasources, type DatasourceConfig, useConfig } from "..";
import { callConfigHook } from "#nitro-drizzle/runtime";

const datasourceConfig: Partial<{
  [TName in keyof DatasourceConfig]: DatasourceConfig[TName][string];
}> = {};

/**
 * @internal
 */
export async function getDriverConfig<TName extends keyof Datasources & string>(name: TName) {
  if (name in datasourceConfig && !datasourceConfig[name]) {
    throw new Error(
      "Cannot obtain datasource config. Do you try to obtain it inside the 'drizzle:config' hook?",
    );
  } else {
    datasourceConfig[name] = undefined;

    const { driver, config } = useConfig(name);

    await callConfigHook(name, driver, config);

    datasourceConfig[name] = config;
  }

  return datasourceConfig[name];
}

export function clearCachedConfig<TName extends keyof Datasources & string>(name: TName) {
  delete datasourceConfig[name];
}
