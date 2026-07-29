import { relative } from "pathe";

const RELATIVE_RE = /^\.{1,2}\//;

/**
 * Computes a relative path from one directory to another, ensuring it starts with `./`.
 * @param from - The source directory
 * @param to - The target path
 * @returns The relative path prefixed with `./` if not already relative
 */
export function relativeWithDot(from: string, to: string) {
  const rel = relative(from, to);
  return RELATIVE_RE.test(rel) ? rel : "./" + rel;
}
