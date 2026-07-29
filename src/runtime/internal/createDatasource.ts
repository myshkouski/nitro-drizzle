import { useDatasourceRegistry } from "#nitro-drizzle/runtime";
import { useConfig, type DatasourceRegistry } from "..";
import { getDriverConfig } from "./config";

/**
 * Creates a datasource instance by name.
 * @internal
 * @param name - The datasource name
 * @returns The datasource instance
 */
export async function createDatasource(name: keyof DatasourceRegistry & string) {
  const datasourceProvider = useDatasourceProvider(name);
  const config = await getDriverConfig(name);
  return await datasourceProvider.create(config);
}

/**
 * Retrieves the datasource provider for a given datasource name.
 * @internal
 * @template TName - The datasource name
 * @param name - The datasource name
 * @returns The datasource provider for the configured driver
 * @throws If the driver is not supported by the datasource
 */
export function useDatasourceProvider<TName extends keyof DatasourceRegistry & string>(
  name: TName,
) {
  const datasourceRegistry = useDatasourceRegistry();
  const { driver } = useConfig(name);
  if (false === driver in datasourceRegistry[name]) {
    throw new Error(`Driver "${driver}" is not supported by "${name}" datasource.`);
  }
  return datasourceRegistry[name][driver];
}
