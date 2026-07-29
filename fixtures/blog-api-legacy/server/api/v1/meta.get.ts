import { useDatasource } from "nitro-drizzle/runtime";
import type { Datasource } from "nitro-drizzle/drivers";

export default defineEventHandler(async (event) => {
  const init = event.context.drizzle.readyState;

  const contentDatasource = await useDatasource("users");
  const usersDatasource = await useDatasource("users");

  return {
    init,
    content: await getDatasourceMeta(contentDatasource),
    users: await getDatasourceMeta(usersDatasource),
  };
});

async function getDatasourceMeta(datasource: Datasource<any, any, any>) {
  let ready = false;
  try {
    await datasource.waitReady();
    ready = true;
  } catch {}

  return {
    ready,
    database: getConstructorName(datasource.database),
    dialect: getConstructorName(datasource.database.dialect),
  };
}

function getConstructorName(obj: any) {
  return Object.getPrototypeOf(obj).constructor.name;
}
