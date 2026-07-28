import type { Datasources, DatasourceVariants } from ".";
import { createDatasource } from "./internal/createDatasource";
import { clearCachedConfig } from "./internal/config";

import { onServerClose } from "#nitro-drizzle/runtime";
import type { ConnectorSpecifier, UnwrapVariant } from "nitro-drizzle/shared";

const datasources: {
  [TName in keyof Datasources & string]?: Promise<Datasources[TName][string]>;
} = {};

/** Options for datasource creation and lifecycle management. */
export type UseDatasourceOptions = Partial<{
  /** Whether to automatically close the datasource when Nitro app closes. */
  autoClose: boolean;
}>;

/**
 * Gets or creates a datasource instance by name.
 * Caches the datasource for reuse.
 * @template TName - The datasource name
 * @param name - The datasource name
 * @param options - Lifecycle options
 * @returns The datasource instance
 */
export async function useDatasource<TName extends ConnectorSpecifier["name"]>(
  name: TName,
  options: UseDatasourceOptions = {},
): Promise<UnwrapVariant<DatasourceVariants, ConnectorSpecifier & { name: TName }>> {
  let datasourcePromise: Promise<
    UnwrapVariant<DatasourceVariants, ConnectorSpecifier & { name: TName }>
  >;

  if (name in datasources) {
    // @ts-expect-error
    datasourcePromise = datasources[name]!;
  } else {
    datasources[name] = createDatasource(name);
    // @ts-expect-error
    datasourcePromise = datasources[name];
    const { autoClose = true } = options;
    if (autoClose) {
      let removeCloseHandler: () => void;
      removeCloseHandler = onServerClose(async () => {
        const datasource = await datasourcePromise;

        clearCachedConfig(name);
        cleanCachedDatasource(name);

        await datasource.close();

        removeCloseHandler();
      });
    }
  }

  return await datasourcePromise;
}

function cleanCachedDatasource<TName extends keyof Datasources & string>(name: TName) {
  delete datasources[name];
}
