import type { Datasource, Schema } from "nitro-drizzle/drivers";
import { useDatasource, type Datasources, type DatasourceVariants } from "nitro-drizzle/runtime";
import type { ConnectorSpecifier, ExpandVariants, Variant } from "nitro-drizzle/shared";
import { useDatasourceProvider } from "./internal/createDatasource";

export async function useDialect<
  TName extends keyof Datasources & string,
  THandlers extends DialectHandlers<TName, DialectHandlerArgs[TName]>,
>(
  name: TName,
  handlers: THandlers,
): Promise<{ [K in keyof THandlers]: ReturnType<THandlers[K]> }[keyof THandlers]> {
  const datasource = await useDatasource(name);
  const { dialect } = useDatasourceProvider(name);
  return await handlers[dialect](datasource);
}

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
