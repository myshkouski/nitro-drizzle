import { genObjectFromValues } from "knitwork";

export type Selector = Record<string, string>;

export type Variant<TValue, TSelector extends Selector> = {
  value: TValue;
  selector: TSelector;
};

export type UnwrapVariant<T extends Variant<any, any>, D extends T["selector"]> =
  T extends Variant<any, D> ? T["value"] : never;

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

export type ExpandVariants<
  TVariant extends Variant<any, any>,
  TOrder extends Dimensions<TVariant>,
> = ExpandVariantsRecursive<TVariant, TOrder, {}>;

export type GenVariantsOptions = {
  variants: [type: string, dimensions: Selector][];
};

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
