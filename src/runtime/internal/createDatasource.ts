import { useDatasourceRegistry } from "#nitro-drizzle/runtime";
import { useConfig, type DatasourceRegistry } from "..";
import { getDriverConfig } from "./config";

/**
 * @internal
 */
export async function createDatasource(name: keyof DatasourceRegistry & string) {
  const datasourceProvider = useDatasourceProvider(name);
  const config = await getDriverConfig(name);
  return await datasourceProvider.create(config);
}

/**
 * @internal
 */
export function useDatasourceProvider<TName extends keyof DatasourceRegistry & string>(
  name: TName,
) {
  const datasourceRegistry = useDatasourceRegistry();
  const { driver } = useConfig(name);
  return datasourceRegistry[name][driver];
}
