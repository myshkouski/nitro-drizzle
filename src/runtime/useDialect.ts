import type { Datasource, Schema } from "nitro-drizzle/drivers";
import { useDatasource, type Datasources, type DatasourceVariants } from "nitro-drizzle/runtime";
import type { ConnectorSpecifier, ExpandVariants, Variant } from "nitro-drizzle/shared";
import { useDatasourceProvider } from "./internal/createDatasource";

/**
 * Provides type-safe dialect-specific handlers for a datasource.
 * Automatically resolves the correct handler based on the configured driver.
 * @template TName - The datasource name
 * @template THandlers - The dialect handlers mapping
 * @param name - The datasource name
 * @param handlers - An object mapping dialect names to handler functions
 * @returns The result of the handler for the current dialect
 */
export async function useDialect<
  TName extends keyof Datasources & string,
  THandlers extends DialectHandlers<TName, DialectHandlerArgs[TName]>,
>(
  name: TName,
  handlers: THandlers,
): Promise<{ [K in keyof THandlers]: ReturnType<THandlers[K]> }[keyof THandlers]> {
  const datasource = await useDatasource(name);
  const { dialect } = useDatasourceProvider(name);
  if (false === dialect in handlers) {
    throw new Error(`No dialect-specific handler provided for dialect "${dialect}".`);
  }
  return await handlers[dialect](datasource);
}

/**
 * Maps dialect names to their handler argument types for a datasource.
 * @template TName - The datasource name
 * @template T - The datasource type
 */
type DialectHandlers<
  TName extends keyof Datasources & string,
  T,
> = T extends DialectHandlerArgs[TName]
  ? {
      [K in keyof T]: K extends keyof DialectHandlerArgs[TName]
        ? (...args: DialectHandlerArgs[TName][K]) => any
        : never;
    }
  : never;

type DialectHandlersArgsMapper<
  T extends Variant<Datasource<string, any, Schema>, ConnectorSpecifier>,
> =
  T extends Variant<infer V, infer S>
    ? Variant<[datasource: V], Pick<S, "name" | "dialect">>
    : never;

type DialectHandlerVariants = DialectHandlersArgsMapper<DatasourceVariants>;

type DialectHandlerArgs = ExpandVariants<DialectHandlerVariants, ["name", "dialect"]>;
