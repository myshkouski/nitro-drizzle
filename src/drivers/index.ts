import type { MaybePromise, UnionToIntersection } from "nitro-drizzle/shared";

/**
 * Schema type representing database tables.
 */
export type Schema = Record<string, any>;

/**
 * Factory function type for creating Drizzle datasource instances.
 * @template TDatabase - The database type
 */
export type Connector<
  TDialect extends string,
  TDatabase,
  TSchema extends Schema,
  TConfig,
  TDatasource extends Datasource<TDialect, TDatabase, TSchema> = Datasource<
    TDialect,
    TDatabase,
    TSchema
  >,
> = (config: TConfig, schema: TSchema) => MaybePromise<TDatasource>;

export type MergeSchema<T extends readonly Schema[], Indices extends keyof T & number> = [
  Indices,
] extends [never]
  ? {}
  : UnionToIntersection<
      {
        [K in Indices]: K extends keyof T ? T[K] : never;
      }[Indices]
    >;

/**
 * Defines a driver factory function.
 * @template TConnector - The driver factory type
 * @param create - The driver factory function
 * @returns The same driver factory function
 */
export function defineConnector<
  TDialect extends string,
  TSchema extends Schema,
  TConnector extends Connector<TDialect, any, TSchema, any>,
>(create: TConnector): TConnector {
  return create;
}

/**
 * Datasource interface representing a connected database with schema.
 * @template TDatabase - The database client type
 * @template TSchema - The schema type
 */
export interface Datasource<_TDialect, TDatabase, TSchema extends Schema> {
  /** The database client instance. */
  database: TDatabase;
  /** The schema definition. */
  schema: TSchema;
  /** Waits for the database connection to be ready. */
  waitReady: () => MaybePromise<void>;
  /** Closes the database connection. */
  close: () => MaybePromise<void>;
}
