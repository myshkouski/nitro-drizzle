import { genObjectFromValues } from "knitwork";

/** A key-value mapping of selector dimensions. */
export type Selector = Record<string, string>;

/** A variant type with a value and selector dimensions. */
export type Variant<TValue, TSelector extends Selector> = {
  value: TValue;
  selector: TSelector;
};

/**
 * Unwraps a variant to its value type, matching the given selector dimensions.
 * @template T - The variant type
 * @template D - The selector dimensions to match
 */
export type UnwrapVariant<T extends Variant<any, any>, D extends T["selector"]> =
  T extends Variant<infer V, D> ? V : never;

type Dimensions<TVariant extends Variant<any, any>> = readonly (keyof TVariant["selector"] &
  string)[];

type OmitNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
} & {};

type ExpandVariantsRecursive<
  TVariant extends Variant<any, any>,
  TOrder extends Dimensions<TVariant>,
  TSelector extends TVariant["selector"],
> = TOrder extends [
  infer TDimension extends string,
  ...other: infer TOtherDimensions extends readonly string[],
]
  ? OmitNever<{
      [K in TVariant["selector"][TDimension]]: ExpandVariantsRecursive<
        TVariant,
        TOtherDimensions,
        TSelector & Record<TDimension, K>
      >;
    }>
  : UnwrapVariant<TVariant, TSelector>;

/**
 * Expands a variant type into a nested object type keyed by selector dimensions.
 * @template TVariant - The variant type
 * @template TOrder - The order of dimensions to expand
 */
export type ExpandVariants<
  TVariant extends Variant<any, any>,
  TOrder extends Dimensions<TVariant>,
> = ExpandVariantsRecursive<TVariant, TOrder, {}>;

export type GenVariantsOptions = {
  variants: [type: string, dimensions: Selector][];
};

/**
 * Generates a TypeScript union type string from variant definitions.
 * @param options - The variant options
 * @returns A TypeScript type string
 */
export function genVariants({ variants }: GenVariantsOptions) {
  if (!variants.length) {
    return "never";
  }
  return variants
    .map(([type, selector]) => {
      return /* ts */ `Variant<${type}, ${genObjectFromValues(selector)}>`;
    })
    .join(" | ");
}
