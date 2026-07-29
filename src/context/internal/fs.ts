import { glob } from "tinyglobby";

/**
 * Resolves file paths matching a glob pattern in a base directory.
 * @param baseDir - The base directory to search in
 * @param pattern - The glob pattern or patterns to match
 * @param options - Optional glob options
 * @returns Sorted list of matching file paths
 */
export async function resolveFiles(
  baseDir: string,
  pattern: string | readonly string[],
  options?: {
    ignore?: string | readonly string[];
    followSymbolicLinks?: boolean;
  },
) {
  const fileNames = await glob(pattern, {
    cwd: baseDir,
    dot: true,
    absolute: true,
    ignore: options?.ignore,
    followSymbolicLinks: options?.followSymbolicLinks,
  });

  return fileNames.sort((a, b) => a.localeCompare(b));
}
