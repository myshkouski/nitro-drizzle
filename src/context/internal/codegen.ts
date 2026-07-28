export type GenTypeNameOptions = {
  generic?: readonly string[];
};

export function genTypeName(name: string, options?: GenTypeNameOptions) {
  let result = `${name}`;
  if (options?.generic?.length) {
    result += "<";
    result += options.generic.join(", ");
    result += ">";
  }
  return result;
}

export type TypeReference = { types: string };
export type PathReference = { path: string };

export function genReference(reference: TypeReference | PathReference) {
  const ref = Object.entries(reference)
    .slice(0, 1)
    .map(([prop, value]) => `${prop}="${value}"`)
    .join("");
  return /* ts */ `/// <reference ${ref} />`;
}
