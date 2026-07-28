import {
  genArrayFromRaw,
  genExport,
  genImport,
  genObjectFromRaw,
  genObjectFromRawEntries,
  genSafeVariableName,
  genString,
} from "knitwork";
import type { DatasourceInfo, MigrationOptions } from "..";
import type { VirtualModules } from "nitro-drizzle/shared";
import { script } from "./format";

function genConnectorModuleVariableName(dbModuleIndex: number) {
  return genSafeVariableName(`dbModule${dbModuleIndex}`);
}

function genMergeSchemaVariableName(dbModuleIndex: number) {
  return genSafeVariableName(`mergedSchema${dbModuleIndex}`);
}

const genSchemaModuleVariableName = (dbModuleIndex: number, schemaIndex: number) =>
  genSafeVariableName(`schemaModule${dbModuleIndex}_${schemaIndex}`);

function mergeSchemaModules(schemaIds: readonly string[], dbModuleIndex: number) {
  return /* js */ `
    Object.assign(
      ${[
        /* js */ `{}`,
        ...schemaIds.map((_, schemaModuleIdIndex) =>
          genSchemaModuleVariableName(dbModuleIndex, schemaModuleIdIndex),
        ),
      ].join(",")}
    )
  `;
}

export type RuntimeVirtualModuleOptions = {
  legacyNitro: boolean;
  runtimeConfigProp: string;
  initHooks?: readonly string[];
};

export function runtimeVirtualModule(
  datasources: readonly DatasourceInfo[],
  { legacyNitro, runtimeConfigProp, initHooks }: RuntimeVirtualModuleOptions,
) {
  const datasourceRegistryParts = datasources
    .filter((datasource) => datasource.enabled)
    .flatMap(({ name, drivers }) => {
      return drivers.map((driver) => {
        return {
          name,
          driver,
        };
      });
    })
    .map(({ name, driver }, datasourceIndex) => {
      const connectorVarName = genConnectorModuleVariableName(datasourceIndex);

      const imports = [
        genImport(driver.imports.connector, connectorVarName),
        ...driver.imports.schema.map((schemaModuleId, schemaIndex) => {
          return genImport(schemaModuleId, {
            name: "*",
            as: genSchemaModuleVariableName(datasourceIndex, schemaIndex),
          });
        }),
      ];

      const mergedSchemaVariableName = genMergeSchemaVariableName(datasourceIndex);
      const mergedSchemaObject = mergeSchemaModules(driver.imports.schema, datasourceIndex);

      const schemaDefinitions = [
        /* js */ `const ${mergedSchemaVariableName} = ${mergedSchemaObject};`,
      ];

      const factoryObject = {
        name,
        driver: driver.name,
        factory: {
          create: /* js */ `(config) => ${connectorVarName}(config, ${mergedSchemaVariableName})`,
          schema: mergedSchemaVariableName,
          dialect: genString(driver.dialect),
        },
      };

      return {
        imports,
        schemaDefinitions,
        factoryObject,
      };
    })
    .reduce(
      (acc, { imports, schemaDefinitions, factoryObject }) => {
        const accFactoryObject = acc.factoryObject;
        accFactoryObject[factoryObject.name] ||= {};
        accFactoryObject[factoryObject.name][factoryObject.driver] = factoryObject.factory;

        return {
          imports: [...acc.imports, ...imports],
          schemaDefinitions: [...acc.schemaDefinitions, ...schemaDefinitions],
          factoryObject: accFactoryObject,
        };
      },
      {
        imports: [] as string[],
        schemaDefinitions: [] as string[],
        factoryObject: {} as { [name: string]: { [driver: string]: object } },
      },
    );

  const datasourceRegistryVarName = genSafeVariableName("datasourceRegistry");

  const nitroRuntimeParts = {
    imports: [
      legacyNitro
        ? genImport("nitropack/runtime", ["useNitroApp"])
        : genImport("nitro/app", ["useNitroHooks"]),
      genImport(legacyNitro ? "nitropack/runtime" : "nitro/runtime-config", [
        {
          name: "useRuntimeConfig",
          as: "useNitroRuntimeConfig",
        },
      ]),
    ],
    declarations: [
      script /* js */ `
        export function useRuntimeConfig() {
          const runtimeConfig = useNitroRuntimeConfig();
          return runtimeConfig[${genString(runtimeConfigProp)}]
        }

        ${
          legacyNitro
            ? script /* js */ `
                function useNitroHooks() {
                  return useNitroApp().hooks;
                }
              `
            : ""
        }

        export function onServerClose(cb) {
          return useNitroHooks().hook("close", cb);
        }

        export function callConfigHook(...args) {
          return useNitroHooks().callHook("drizzle:config", ...args);
        }
      `,
    ],
    exports: [genExport(legacyNitro ? "nitropack/runtime" : "nitro/storage", ["useStorage"])],
  };

  return script /* js */ `
    ${datasourceRegistryParts.imports.join("\n")}
    ${nitroRuntimeParts.imports.join("\n")}
    
    ${datasourceRegistryParts.schemaDefinitions.join("\n")}
    
    const ${datasourceRegistryVarName} = ${genObjectFromRaw(datasourceRegistryParts.factoryObject)};

    export function useDatasourceRegistry() {
      return ${datasourceRegistryVarName};
    }

    ${nitroRuntimeParts.declarations.join("\n")}

    ${nitroRuntimeParts.exports.join("\n")}

    export const initHooks = ${JSON.stringify(initHooks || [])};
  `;
}

// Replaced with aliases
export function dialectVirtualModules(
  datasources: readonly DatasourceInfo[],
): VirtualModules<`#nitro-drizzle/${string}`> {
  return Object.fromEntries(
    datasources
      .filter((d) => d.enabled)
      .map(({ name }) => {
        return [
          `#nitro-drizzle/dialects/${name}`,
          `export {};`,
          // genExport(`nitro-drizzle/dialects/${dialect}`, "*"),
        ] as const;
      }),
  );
}

export function migrationsVirtualModule(
  datasources: readonly DatasourceInfo[],
  options: MigrationOptions | undefined,
): VirtualModules<`#nitro-drizzle/${string}`> {
  if (!options) {
    return {};
  }

  const parts: string[] = [];

  const enabledDatasources = datasources.filter((d) => d.enabled);

  parts.push(/*js*/ `
    export const migrationConfig = ${genObjectFromRawEntries(
      enabledDatasources.map(({ name, drivers }) => {
        return [
          name,
          genObjectFromRawEntries(
            drivers.map((driver) => {
              return [driver.name, JSON.stringify(driver.migrations.config)];
            }),
          ),
        ];
      }),
    )};
  `);

  let migrateOnInit = enabledDatasources.map((d) => d.name);
  if (options && Array.isArray(options.migrateOnInit)) {
    migrateOnInit = migrateOnInit.filter((name) =>
      (options.migrateOnInit as readonly string[]).includes(name),
    );
  }

  parts.push(script /*js*/ `
    export const MIGRATIONS_STORAGE_BASE = ${genString(options.storageBase)};
    export const MIGRATE_ON_INIT = ${genArrayFromRaw(migrateOnInit.map((name) => genString(name)))};
  `);

  return {
    "#nitro-drizzle/migrations": parts.join("\n"),
  };
}
