import { useDatasource } from "nitro-drizzle/runtime";
// @ts-expect-error no type definitions for internal "#nitro-drizzle/runtime"
import { useDatasourceRegistry } from "#nitro-drizzle/runtime";

export default defineEventHandler(async () => {
  return {
    content: await getDatasourceMeta("content"),
    users: await getDatasourceMeta("users"),
  };
});

async function getDatasourceMeta(name: string) {
  const datasource = await useDatasource(name);
  let ready = false;
  try {
    await datasource.waitReady();
    ready = true;
  } catch {}

  return {
    ready,
    database: getConstructorName(datasource.database),
    dialect: getConstructorName(
      // @ts-expect-error
      datasource.database.dialect,
    ),
    drivers: getDatasourceDrivers(name),
  };
}

function getConstructorName(obj: any) {
  return Object.getPrototypeOf(obj).constructor.name;
}

export function getDatasourceDrivers(name: string): readonly string[] {
  const datasourceRegistry = useDatasourceRegistry();
  return Object.keys(datasourceRegistry[name]);
}
