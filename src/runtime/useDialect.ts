import type { Datasource, Schema } from "nitro-drizzle/drivers";
import { useDatasource, type Datasources, type DatasourceVariants } from "nitro-drizzle/runtime";
import type { ConnectorSpecifier, ExpandVariants, Variant } from "nitro-drizzle/shared";
import { useDatasourceProvider } from "./internal/createDatasource";

export type DialectOf<TDatasource extends Datasource<any, any, any>> =
  TDatasource extends Datasource<infer TDialect, any, any> ? TDialect : never;

export type DatasourceOfDialect<
  TDialect extends string,
  TDatasource extends Datasource<any, any, any>,
> = TDatasource extends Datasource<TDialect, any, any> ? TDatasource : never;

type ExactHandlers<
  TName extends keyof Datasources & string,
  T,
> = T extends DialectHandlerArgs[TName]
  ? {
      [K in keyof T]: K extends keyof DialectHandlerArgs[TName]
        ? (...args: DialectHandlerArgs[TName][K]) => any
        : never;
    }
  : never;

export async function useDialect<
  TName extends keyof Datasources & string,
  THandlerArgs extends DialectHandlerArgs[TName],
  THandlers extends ExactHandlers<TName, THandlerArgs>,
>(
  name: TName,
  handlers: THandlers,
): Promise<{ [K in keyof THandlers]: ReturnType<THandlers[K]> }[keyof THandlers]> {
  const datasource = await useDatasource(name);
  const { dialect } = useDatasourceProvider(name);
  return await handlers[dialect](datasource);
}

type DialectHandlersArgsMapper<
  T extends Variant<Datasource<string, any, Schema>, ConnectorSpecifier>,
> = T extends any
  ? Variant<[datasource: T["value"]], Pick<T["selector"], "name" | "dialect">>
  : never;

type DialectHandlerVariants = DialectHandlersArgsMapper<DatasourceVariants>;

type DialectHandlerArgs = ExpandVariants<DialectHandlerVariants, ["name", "dialect"]>;
