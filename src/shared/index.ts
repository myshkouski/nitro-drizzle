import type { VirtualModule } from "nitropack/types";
import type { NitroRuntimeHooks as LegacyNitroRuntimeHooks } from "nitropack/types";
import type { NitroRuntimeHooks } from "nitro/types";

/**
 * A type that can be either a value or a promise resolving to that value.
 * @template T - The underlying type
 */
export type MaybePromise<T> = T | Promise<T>;

export type VirtualModules<TName extends string = string> = Record<TName, VirtualModule>;

export type NitroHookName = keyof NitroRuntimeHooks | keyof LegacyNitroRuntimeHooks;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export interface DatasourceMetadata {}

export * from "./variants";
