import { useConfig, useDatasource, type DatasourceRegistry } from "nitro-drizzle/runtime";
import { migrationConfig } from "#nitro-drizzle/migrations";
import { useMigrations } from "./useMigrations";
import { migrateDatabase, type DrizzleDatabase, type MigrationConfig } from "./internal/migrate";

/** Result of a migration operation. */
export type MigrationResult = {};

export type { MigrationConfig };

/**
 * Runs migrations for a specific datasource.
 * @template TName - The datasource name
 * @param name - The datasource name to migrate
 * @returns Migration result
 */
export async function migrate<TName extends keyof DatasourceRegistry & string>(
  name: TName,
): Promise<MigrationResult> {
  const { driver } = useConfig(name);
  const { database, waitReady } = await useDatasource(name);
  const migrations = await useMigrations(name);
  const config = migrationConfig[name][driver];
  await waitReady();
  await migrateDatabase(database as any as DrizzleDatabase, migrations, config);
  return {};
}
