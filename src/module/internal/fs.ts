import { mkdir, writeFile as fspWriteFile } from "node:fs/promises";
import { dirname } from "pathe";

/**
 * Writes a file to disk, creating parent directories as needed.
 * @param file - The file path to write
 * @param contents - The content to write
 */
export async function writeFile(file: string, contents: Buffer | string) {
  await mkdir(dirname(file), { recursive: true });
  await fspWriteFile(file, contents, typeof contents === "string" ? "utf8" : undefined);
}
