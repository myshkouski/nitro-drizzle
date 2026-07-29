/** Options for generating a type name with generics. */
export type GenTypeNameOptions = {
  generic?: readonly string[];
};

/**
 * Generates a TypeScript type name with optional generic parameters.
 * @param name - The base type name
 * @param options - Options for generic parameters
 * @returns The generated type name string
 */
export function genTypeName(name: string, options?: GenTypeNameOptions) {
  let result = `${name}`;
  if (options?.generic?.length) {
    result += "<";
    result += options.generic.join(", ");
    result += ">";
  }
  return result;
}

/** A type reference for triple-slash directives. */
export type TypeReference = { types: string };
/** A path reference for triple-slash directives. */
export type PathReference = { path: string };

/**
 * Generates a TypeScript triple-slash reference directive.
 * @param reference - The type or path reference
 * @returns The reference directive string
 */
export function genReference(reference: TypeReference | PathReference) {
  const ref = Object.entries(reference)
    .slice(0, 1)
    .map(([prop, value]) => `${prop}="${value}"`)
    .join("");
  return /* ts */ `/// <reference ${ref} />`;
}
