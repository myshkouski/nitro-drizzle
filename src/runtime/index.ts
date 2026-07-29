import type { Datasource, Connector } from "nitro-drizzle/drivers";
import type {
  ConnectorSpecifier,
  ConnectorVariants,
  ExpandVariants,
  MaybePromise,
  Selector,
  Variant,
} from "nitro-drizzle/shared";

/**
 * Provider interface for creating Drizzle datasource instances.
 * @template TConfig - The configuration type for the datasource
 * @template TDatasource - The datasource type that extends Datasource
 */
export interface DatasourceProvider<
  TDialect,
  TConfig,
  TDatasource extends Datasource<any, any, any>,
> {
  dialect: TDialect;
  create(config: TConfig): MaybePromise<TDatasource>;
}

type ConfigMapper<T extends Variant<Connector<any, any, any, any>, ConnectorSpecifier>> =
  T extends any ? Variant<ConfigOf<T["value"]>, Pick<T["selector"], "name" | "driver">> : never;

type ConfigVariants = ConfigMapper<ConnectorVariants>;

type RuntimeConfigMapper<T extends Variant<any, Selector>> = T extends any
  ? Variant<PrimitiveProps<T["value"]>, T["selector"]>
  : never;

type RuntimeConfigVariants = RuntimeConfigMapper<ConfigVariants>;

type DatasourceProviderMapper<
  T extends Variant<Connector<any, any, any, any>, ConnectorSpecifier>,
> =
  T extends Variant<infer V, infer S>
    ? Variant<
        V extends Connector<infer TDialect, any, infer TConfig, any>
          ? DatasourceProvider<TDialect, TConfig, DatasourceOf<V>>
          : never,
        S
      >
    : never;

export type DatasourceProviderVariants = DatasourceProviderMapper<ConnectorVariants>;

/**
 * Registry interface for datasource providers.
 */
export type DatasourceRegistry = ExpandVariants<DatasourceProviderVariants, ["name", "driver"]>;

/**
 * Extracts the configuration type from a Connector.
 * @template T - The Connector type
 */
export type ConfigOf<T extends Connector<any, any, any, any>> =
  T extends Connector<any, any, any, infer TConfig> ? TConfig : never;

/**
 * Extracts the datasource type from a Connector factory.
 * @template T - The Connector type
 */
export type DatasourceOf<T extends Connector<any, any, any, any>> = T extends (
  ...args: any
) => MaybePromise<infer R>
  ? R extends Datasource<any, any, any>
    ? R
    : never
  : never;

type DatasourceMapper<T extends Variant<Connector<any, any, any, any>, ConnectorSpecifier>> =
  T extends any ? Variant<DatasourceOf<T["value"]>, T["selector"]> : never;

/**
 * Mapped type of all datasources from the registry.
 * Provides access to datasource instances by name.
 */
export type DatasourceVariants = DatasourceMapper<ConnectorVariants>;

export type Datasources = ExpandVariants<DatasourceVariants, ["name", "driver"]>;

/**
 * Recursively extracts primitive properties from a type.
 * @template T - The type to extract primitive properties from
 */
export type PrimitiveProps<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? PrimitiveProps<T[K]>
    : T[K] extends Primitive
      ? T[K]
      : never;
};

/**
 * Primitive types supported by the runtime configuration.
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * Extracts the configuration type from a DatasourceProvider.
 * @template T - The DatasourceProvider type
 */
export type DatasourceProviderConfig<T extends DatasourceProvider<any, any, any>> =
  T extends DatasourceProvider<any, infer TConfig, any> ? TConfig : never;

/**
 * Configuration type mapping datasource names to their configurations.
 */
export type DatasourceConfig = ExpandVariants<ConfigVariants, ["name", "driver"]>;

/**
 * Runtime configuration type with primitive values for each datasource.
 * Used for Nitro runtime config.
 */
export type DriverRuntimeConfig = ExpandVariants<RuntimeConfigVariants, ["name", "driver"]>;

type DriverNameMapper<T extends Variant<any, Selector>> =
  T extends Variant<any, infer S> ? Variant<{ driver?: S["driver"] | "" }, Pick<S, "name">> : never;

type DriverNameVariants = DriverNameMapper<RuntimeConfigVariants>;

/**
 * Runtime config type including driver name variants for each datasource.
 */
export type RuntimeConfig = DriverRuntimeConfig & ExpandVariants<DriverNameVariants, ["name"]>;

declare module "nitropack/types" {
  interface NitroRuntimeConfig {
    drizzle?: RuntimeConfig;
  }
}

declare module "nitro/types" {
  interface NitroRuntimeConfig {
    drizzle?: RuntimeConfig;
  }
}

type ConfigHookArgsMapper<T extends Variant<any, Selector>> =
  T extends Variant<infer V, infer S> ? [name: S["name"], driver: S["driver"], config: V] : never;

/**
 * Arguments passed to the `drizzle:config` hook.
 */
export type ConfigHookArgs = ConfigHookArgsMapper<ConfigVariants>;

/**
 * Hooks for Drizzle datasource configuration.
 */
export interface ConfigHooks {
  "drizzle:config": (...args: ConfigHookArgs) => void | Promise<void>;
}

declare module "nitropack/types" {
  interface NitroRuntimeHooks extends ConfigHooks {}
}

declare module "nitro/types" {
  interface NitroRuntimeHooks extends ConfigHooks {}
}

export * from "./useDatasource";
export * from "./useDialect";
export * from "./useConfig";
