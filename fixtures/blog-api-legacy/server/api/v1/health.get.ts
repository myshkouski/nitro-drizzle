export default defineEventHandler((event) => {
  const readyState = event.context.drizzle?.readyState;
  setResponseStatus(event, "done" == readyState ? 200 : 500);
  return {
    readyState,
  };
});
