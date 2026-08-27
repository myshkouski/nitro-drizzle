import type { Datasource, Schema } from "nitro-drizzle/drivers";
import {
  useConfig,
  useDatasource,
  type Datasources,
  type DatasourceVariants,
} from "nitro-drizzle/runtime";
import type { ConnectorSpecifier, UnwrapVariant, Variant } from "nitro-drizzle/shared";
import { useDatasourceProvider } from "./internal/createDatasource";

/**
 * Executes a callback with type-safe context (datasource, driver, dialect) for the specified datasource.
 * Automatically resolves the active datasource, driver, and dialect based on the runtime configuration.
 * @template TName - The datasource name
 * @template TArgs - The dialect callback arguments type
 * @template TReturn - The return type of the callback
 * @param name - The datasource name
 * @param callback - The callback function receiving `{ datasource, driver, dialect }`
 * @returns A promise that resolves to the return value of the callback
 */
export async function useDialect<
  TName extends keyof Datasources & string,
  TArgs extends DialectCallbackArgs<TName>,
  TReturn,
>(name: TName, callback: DialectCallback<TName, TArgs, TReturn>): Promise<TReturn> {
  const datasource = await useDatasource(name);
  const { dialect } = useDatasourceProvider(name);
  const { driver } = useConfig(name);

  // @ts-expect-error
  return await callback({
    datasource,
    driver,
    dialect,
  });
}

type DialectCallbackArgsMapper<
  T extends Variant<Datasource<string, any, Schema>, ConnectorSpecifier>,
> =
  T extends Variant<infer V, infer S>
    ? Variant<Pick<S, "dialect" | "driver"> & { datasource: V }, Pick<S, "name">>
    : never;

type DialectCallbackArgsVariants = DialectCallbackArgsMapper<DatasourceVariants>;

type DialectCallbackArgs<TName extends keyof Datasources & string> = UnwrapVariant<
  DialectCallbackArgsVariants,
  { name: TName }
>;

/**
 * Callback function signature for `useDialect`.
 * @template TName - The datasource name
 * @template TArgs - The callback argument types
 * @template TReturn - The return type of the callback
 */
export type DialectCallback<
  TName extends keyof Datasources & string,
  TArgs extends DialectCallbackArgs<TName>,
  TReturn,
> = {
  (args: TArgs): TReturn;
};
