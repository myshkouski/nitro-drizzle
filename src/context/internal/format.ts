import { dedent } from "strip-indent";

/**
 * Tagged template literal function that dedents and interpolates values.
 * @param strings - The template strings array
 * @param values - The interpolated values
 * @returns The dedented and interpolated string
 */
export function script(strings: TemplateStringsArray, ...values: unknown[]): string {
  const rawStrings = strings.raw;
  let result = "";

  for (let i = 0; i < rawStrings.length; i++) {
    const string = rawStrings[i];
    result += string;

    if (i < values.length) {
      let valueStr = String(values[i]);
      const match = string.match(/\n([\t\s]*)([^\t\s]*)$/g)?.at(0);
      if (match) {
        valueStr = valueStr.replaceAll("\n", match);
      }
      result += valueStr;
    }
  }

  return dedent(result);
}
