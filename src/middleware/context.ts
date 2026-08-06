import { defineMiddleware } from "nitro";
import { useNitroHooks } from "nitro/app";
import type { Middleware } from "nitro/h3";
import "srvx";

let eventContext: DrizzleContext | undefined;

/**
 * Nitro middleware that initializes the Drizzle context on each request.
 * Sets up the `drizzle` property on the event context with readiness state and wait capability.
 */
const middleware: Middleware = defineMiddleware((event): void => {
  if (!eventContext) {
    const hooks = useNitroHooks();

    let readyState: ReadyState = "pending";
    let initHook: Promise<void>;

    initHook = Promise.resolve(hooks.callHook("drizzle:init"))
      .then(() => {
        readyState = "done";
      })
      .catch((err) => {
        readyState = "error";
        throw err;
      });

    eventContext = {
      get readyState() {
        return readyState;
      },
      waitReady: async () => {
        await initHook;
      },
    };
  }

  event.context.drizzle = eventContext;
});

export default middleware;

/** The readiness state of the Drizzle initialization. */
export type ReadyState = "pending" | "done" | "error";

/** Hooks for Drizzle initialization. */
export type InitHooks = {
  "drizzle:init": () => void;
};

declare module "nitro/types" {
  interface NitroRuntimeHooks extends InitHooks {}
}

/** Context provided by the Drizzle middleware on the event context. */
export interface DrizzleContext {
  readonly readyState: ReadyState;
  readonly waitReady: () => Promise<void>;
}

/** Event context extension for Drizzle. */
export interface EventContext {
  drizzle: DrizzleContext;
}

declare module "srvx" {
  interface ServerRequestContext extends EventContext {}
}
