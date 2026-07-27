import { defineHandler } from "nitro";

export default defineHandler(async (event) => {
  const { readyState } = event.context.drizzle;
  event.res.status = "done" == readyState ? 200 : 500;
  return {
    readyState,
  };
});
