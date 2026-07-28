import { genTypeImport, genString, genObjectFromValues } from "knitwork";
import type { DatasourceInfo, DriverOptions } from "..";
import { genVariants, type Selector, type VirtualModules } from "nitro-drizzle/shared";
import { script } from "./format";

type ConnectorInfo = {
  name: string;
  driver: DriverOptions;
};

function getConnectorDimensions({ name, driver }: ConnectorInfo) {
  return {
    name,
    dialect: driver.dialect,
    driver: driver.name,
  };
}

class ImportedModules {
  readonly #files: string[] = [];

  values(): readonly string[] {
    return [...this.#files];
  }

  getOrAdd(value: string): number {
    let index = this.#files.indexOf(value);
    if (!~index) {
      index = this.#files.push(value);
    }
    return index;
  }
}

export function sharedTypeDeclarations(
  datasources: readonly DatasourceInfo[],
): VirtualModules<`${string}.d.ts`> {
  const moduleId = "nitro-drizzle/shared";
  const connectors = datasources.flatMap(({ name, drivers }) => {
    return drivers.map((driver) => {
      return {
        name,
        driver,
      };
    });
  });

  const SCHEMA_PARTS_TYPE = "SchemaParts";
  const SCHEMA_TYPE = "SchemaVariants";
  const CONNECTOR_TYPE = "Connectors";
  const UNWRAP_VARIANT_TYPE = "UnwrapVariant";
  const MERGE_SCHEMA_TYPE = "MergeSchema";

  const schemaFiles = new ImportedModules();
  connectors
    .flatMap((connector) => {
      return connector.driver.imports.schema;
    })
    .forEach((schemaFile) => {
      schemaFiles.getOrAdd(schemaFile);
    });

  const driverImports = new ImportedModules();
  connectors.forEach((connector) => {
    driverImports.getOrAdd(connector.driver.imports.connector);
  });

  const content = [
    genTypeImport("nitro-drizzle/shared", ["Variant", UNWRAP_VARIANT_TYPE]),
    genTypeImport("nitro-drizzle/drivers", ["Schema", MERGE_SCHEMA_TYPE]),

    script /* ts */ `type ${SCHEMA_PARTS_TYPE} = [
      ${schemaFiles
        .values()
        .map((file) => {
          return `typeof import(${genString(file)})`;
        })
        .join(",\n")}
    ]`,

    script /* ts */ `type ${CONNECTOR_TYPE}<TSchema extends Schema> = [
      ${driverImports
        .values()
        .map((file) => {
          return `typeof import(${genString(file)}).default<TSchema>`;
        })
        .join(",\n")}
    ]`,

    script /**ts */ `type ${SCHEMA_TYPE} = 
      ${genVariants({
        variants: connectors.map((connector): [schemaType: string, dimensions: Selector] => {
          return [
            `${MERGE_SCHEMA_TYPE}<${SCHEMA_PARTS_TYPE}, ${
              connector.driver.imports.schema
                .map((schemaFile) => {
                  return schemaFiles.getOrAdd(schemaFile).toString();
                })
                .join(" | ") || "never"
            }>`,
            getConnectorDimensions(connector),
          ];
        }),
      })}
    `,

    script /**ts */ `
      declare module ${genString(moduleId)} {
        type ConnectorVariants = ${genVariants({
          variants: connectors.map((connector): [connectorType: string, selector: Selector] => {
            const dimensions = getConnectorDimensions(connector);
            return [
              /* ts */ `${CONNECTOR_TYPE}<${UNWRAP_VARIANT_TYPE}<${SCHEMA_TYPE}, ${genObjectFromValues(dimensions)}>>[${driverImports.getOrAdd(connector.driver.imports.connector)}]`,
              dimensions,
            ];
          }),
        })};
      }
    `,
  ].join("\n\n");

  return {
    [`${moduleId}.d.ts`]: content,
  };
}

/** @deprecated */
export function runtimeDeclarations(_datasources: readonly DatasourceInfo[]) {
  return "";
}

export type TypeReference = { types: string };

export type PathReference = { path: string };

export function genReference(reference: TypeReference | PathReference) {
  return /* ts */ `/// <reference ${Object.entries(reference)
    .map(([prop, value]) => `${prop}="${value}"`)
    .join("")} />`;
}

export function moduleTypeDeclarations(
  _datasources: readonly DatasourceInfo[],
): VirtualModules<`${string}.d.ts`> {
  const moduleId = "nitro-drizzle/module";

  const content = [genReference({ types: moduleId })].join("\n");

  return {
    "nitro-drizzle/module.d.ts": content,
  };
}

/** @deprecated */
export function dialectDeclarations(_datasources: readonly DatasourceInfo[]) {
  return ``;
}
