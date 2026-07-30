import type { ConsolaInstance } from "consola";
import { colorize, type ColorName } from "consola/utils";
import type { Config, Config as DrizzleConfig } from "drizzle-kit";
import { loadConfig } from "c12";
import { pkgDir, pkgName } from "nitro-drizzle/meta";

import { mapAsync } from "./internal/async";
import { accent } from "./internal/logger";
import { resolveFiles } from "./internal/fs";
import {
  dialectDeclarations,
  moduleTypeDeclarations,
  runtimeDeclarations,
  sharedTypeDeclarations,
} from "./internal/templates";
import { transformDrizzleConfig } from "./internal/config";
import {
  dialectVirtualModules,
  migrationsVirtualModule,
  runtimeVirtualModule,
} from "./internal/virtual";

import type { MaybePromise, NitroHookName, VirtualModules } from "nitro-drizzle/shared";
import type { ServerAssetDir as LegacyServerAssetDir } from "nitropack/types";
import type { ServerAssetDir } from "nitro/types";
import { join } from "pathe";
import { genReference } from "./internal/codegen";

/**
 * Context interface for managing Drizzle datasource configurations.
 */
export interface Context {
  init(): MaybePromise<void>;
  /**
   * Reloads the context, clearing any cached datasource information.
   */
  reload(): MaybePromise<void>;
  /**
   * Returns a list of all resolved datasource information.
   */
  datasources(): MaybePromise<DatasourceInfo[]>;
}

class DefaultContext implements Context {
  #datasources: DatasourceInfo[] | null = null;
  readonly #options: ContextOptions;

  constructor(options: ContextOptions) {
    this.#options = options;
  }

  async init(): Promise<void> {
    const datasources = await this.datasources();

    await this.#options.plugins(this.enabledPlugins());

    const [sharedTypes, virtualModules, virtualTypes, moduleTypes, runtimeTypes] =
      await Promise.all([
        sharedTypeDeclarations(datasources),
        this.virtualModules(datasources),
        this.virtualTypeDeclarations(datasources),
        this.moduleTypeDeclarations(datasources),
        this.runtimeTypeDeclarations(datasources),
      ]);

    await this.#options.virtualModules(virtualModules);

    await this.#options.declarations({
      shared: sharedTypes,
      module: moduleTypes,
      runtime: runtimeTypes,
      virtual: virtualTypes,
    });

    if (this.#options.migrations) {
      const assets = await this.migrationAssets(datasources);
      if (assets) {
        await this.#options.assets(assets);
      }

      await this.#options.tasks?.({
        "drizzle:migrate": {
          description: "Run drizzle migrations for a datasource.",
          handler: "nitro-drizzle/migrations/task",
        },
      });
    }

    if (this.#options.externals) {
      const inlineModuleIds = ["runtime", "plugins", "migrations"].flatMap((id) => {
        return [join(pkgName, id), join(pkgDir, "dist", id)];
      });

      await this.#options.externals(inlineModuleIds);
    }
  }

  async datasources() {
    const {
      logger,
      baseDir,
      configPattern,
      resolver,
      datasources: datasourceOptions,
    } = this.#options;

    if (!this.#datasources) {
      logger?.info("Searching drizzle datasources in", colorize("blue", baseDir));

      const drizzleConfigsResolvedPaths = await resolveFiles(
        baseDir,
        [configPattern].flat().map((pattern) => "*/" + pattern),
      );

      const drizzleConfigs = [
        ...(await mapAsync(drizzleConfigsResolvedPaths, async (path) => {
          const [_, dirName] = path.match(/(.+\/(.+))\/.+$/)!.slice(1, 3) as [string, string];
          const { config } = await loadConfig<DrizzleConfig>({
            configFile: path,
          });

          return await transformDrizzleConfig(config, {
            cwd: this.#options.cwd,
            path,
            dirName,
            resolver,
          });
        })),
      ].sort((a, b) => {
        if (a.driver && b.driver) {
          return 0;
        }
        return 1;
      });

      const datasources: DatasourceInfo[] = Object.entries(datasourceOptions).map(
        ([name, options]) => {
          const drivers: readonly string[] = Array.isArray(options.drivers)
            ? options.drivers
            : Object.entries(options.drivers as { [name: string]: boolean })
                .filter(([_name, enabled]) => enabled)
                .map(([name]) => name);
          return {
            name,
            enabled: true,
            drivers: drivers.map((driverName) => {
              const dialect = driverToDialect(driverName);
              const drizzleConfig = drizzleConfigs.find((config) => {
                return config.name == name && config.dialect == dialect;
              });
              return {
                name: driverName,
                dialect,
                imports: {
                  connector: `nitro-drizzle/drivers/${driverName}`,
                  helpers: `nitro-drizzle/dialects/${dialect}`,
                  schema: drizzleConfig?.imports.schema || [],
                },
                migrations: {
                  ...drizzleConfig?.migrations,
                },
              };
            }),
          } satisfies DatasourceInfo;
        },
      );

      logger?.info(
        "Found drizzle datasources:",
        datasources
          .toSorted((datasource) => {
            return datasource.enabled ? -1 : 1;
          })
          .map((datasource) => {
            let msg = [datasource.name];
            let color: ColorName;
            if (datasource.enabled) {
              color = "greenBright";
            } else {
              color = "gray";
              msg.push("(disabled)");
            }
            return colorize(color, msg.join(" "));
          })
          .join(", "),
      );

      const enabledDatasources = datasources.filter((d) => d.enabled);

      logger?.info(
        accent`Using ${enabledDatasources.length} of ${datasources.length} resolved datasources` +
          (enabledDatasources.length > 0 ? ":" : ""),
        enabledDatasources
          .map((datasource) => {
            return [
              colorize("greenBright", datasource.name),
              colorize(
                "yellow",
                "(" + datasource.drivers.map((driver) => driver.name).join(", ") + ")",
              ),
            ].join(" ");
          })
          .join(", "),
      );

      this.#datasources = datasources;
    }

    return this.#datasources;
  }

  private async migrationAssets(
    datasources: readonly DatasourceInfo[],
  ): Promise<readonly (ServerAssetDir | LegacyServerAssetDir)[]> {
    const migrationOptions = this.#options.migrations;

    if (!migrationOptions) {
      return [];
    }

    return datasources
      .flatMap((datasource) => {
        return datasource.drivers.map((driver) => {
          return {
            name: datasource.name,
            driver: driver.name,
            dialect: driver.dialect,
            migrations: driver.migrations,
          };
        });
      })
      .reduce(
        (acc, { name, driver, migrations }) => {
          const dir = migrations.assets;
          if (dir) {
            acc.push({
              baseName: [migrationOptions.storageBase, name, driver].join(":"),
              dir,
              /**
               * @todo Doesn't work in dev mode - 'fs' driver does not support 'pattern'
               * Disabled - include all files to use with meta/_journal.json
               */
              // pattern: '*.sql',
            });
          }
          return acc;
        },
        [] as (ServerAssetDir | LegacyServerAssetDir)[],
      );
  }

  private async virtualTypeDeclarations(
    datasources: readonly DatasourceInfo[],
  ): Promise<Record<string, VirtualModules<`${string}.d.ts`>>> {
    return {
      "#nitro-drizzle/*": {
        "nitro-drizzle/virtual.d.ts": [dialectDeclarations(datasources)].join("\n"),
      },
    };
  }

  private enabledPlugins(): readonly string[] {
    const plugins: ("init" | "migrate")[] = [];

    const migrationOptions = this.#options.migrations;
    const enableMigrationPlugin = migrationOptions
      ? Array.isArray(migrationOptions)
        ? 0 < migrationOptions.length
        : true == migrationOptions.migrateOnInit
      : false;

    if (enableMigrationPlugin) {
      plugins.push("migrate");
    }

    plugins.push("init");

    let pluginIds: readonly string[] = plugins;
    if (this.#options.legacy) {
      pluginIds = pluginIds.map((pluginName) => `legacy/${pluginName}`);
    }
    pluginIds = pluginIds.map((pluginName) => `nitro-drizzle/plugins/${pluginName}`);

    return pluginIds;
  }

  private async moduleTypeDeclarations(
    datasources: readonly DatasourceInfo[],
  ): Promise<VirtualModules> {
    return moduleTypeDeclarations(datasources);
  }

  private async runtimeTypeDeclarations(
    datasources: readonly DatasourceInfo[],
  ): Promise<VirtualModules<`${string}.d.ts`>> {
    const references = new Set([
      { types: "nitro-drizzle/runtime" },
      ...this.enabledPlugins().map((pluginId) => {
        return { types: pluginId };
      }),
    ]);
    if (!this.#options.legacy) {
      references.add({ types: "nitro-drizzle/middleware/context" });
    }
    const content = [
      ...[...references.values()].map((reference) => genReference(reference)),
      runtimeDeclarations(datasources),
      /* ts */ `export {};`,
    ].join("\n");
    return {
      "nitro-drizzle/runtime.d.ts": content,
    };
  }

  private async virtualModules(
    datasources: readonly DatasourceInfo[],
  ): Promise<VirtualModules<`#nitro-drizzle/${string}`>> {
    return {
      "#nitro-drizzle/runtime": runtimeVirtualModule(datasources, {
        legacyNitro: this.#options.legacy,
        runtimeConfigProp: "drizzle",
        initHooks: this.#options.initHooks,
      }),
      ...dialectVirtualModules(datasources),
      ...migrationsVirtualModule(datasources, this.#options.migrations),
    };
  }

  reload() {
    this.#datasources = null;
  }
}

function driverToDialect(driver: string) {
  let dialect = driver;
  if (driver.startsWith("d1")) {
    dialect = "sqlite";
  }
  if (driver == "pglite") {
    dialect = "postgresql";
  }
  return dialect;
}

/**
 * Glob pattern or array of patterns to match Drizzle configuration files.
 */
export type ConfigPattern = string | readonly string[];

/**
 * Resolver interface for importing modules and resolving paths.
 */
export interface Resolver {
  /**
   * Resolves a module ID to its full path.
   */
  resolve(id: string): string;
}

export type ContextHook<TArgs extends readonly any[] = []> = (
  this: void,
  ...args: TArgs
) => MaybePromise<void>;

export interface MigrationOptions {
  /** Base storage key path for migrations. */
  storageBase: string;
  /** Whether and which datasources to migrate on initialization. */
  migrateOnInit: boolean | readonly string[];
}

export interface ContextOptions {
  legacy: boolean;

  logger?: ConsolaInstance;
  /**
   * Current working directory
   */
  cwd: string;
  /**
   * Base project directory to search drizzle config files
   */
  baseDir: string;
  /**
   * Pattern for drizzle config files
   */
  configPattern: ConfigPattern;
  /**
   * Nuxt Kit resolver
   */
  resolver: Resolver;
  /**
   * Connector options
   */
  datasources: Record<string, { drivers: readonly string[] | { [name: string]: boolean } }>;

  migrations: MigrationOptions | undefined;

  /**
   * Hooks that allowed to call "drizzle:init" hook.
   */
  initHooks?: readonly NitroHookName[];

  tasks?: ContextHook<
    [
      tasks: Record<
        string,
        {
          handler: string;
          description: string;
        }
      >,
    ]
  >;

  plugins: ContextHook<[plugins: readonly string[]]>;

  declarations: ContextHook<
    [
      declarations: {
        shared: VirtualModules<`${string}.d.ts`>;
        module: VirtualModules<`${string}.d.ts`>;
        runtime: VirtualModules<`${string}.d.ts`>;
        virtual: Record<string, VirtualModules<`${string}.d.ts`>>;
      },
    ]
  >;

  virtualModules: ContextHook<[modules: VirtualModules]>;

  assets: ContextHook<[assets: readonly (ServerAssetDir | LegacyServerAssetDir)[]]>;

  externals?: ContextHook<[modules: readonly string[]]>;
}

/**
 * Creates a Context instance for managing Drizzle datasource configurations.
 * @param options - Configuration options for the context
 * @returns A Context instance
 */
export function createContext(options: ContextOptions): Context {
  return new DefaultContext(options);
}

/**
 * Information about a resolved Drizzle datasource.
 */
export interface DatasourceInfo {
  /** Unique name identifier for the datasource. */
  name: string;
  /** Whether the datasource is enabled (filtered by connector configuration). */
  enabled: boolean;
  /** Driver configurations for this datasource. */
  drivers: readonly DriverOptions[];
}

/** Options for a specific driver within a datasource. */
export type DriverOptions = {
  name: string;
  dialect: string;
  imports: {
    // config: string;
    schema: readonly string[];
    connector: string;
    helpers: string;
  };
  /** Migration configuration for this datasource driver. */
  migrations: {
    assets?: string;
    config?: Config["migrations"];
  };
};
