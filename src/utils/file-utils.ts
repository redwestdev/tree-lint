import fs from "node:fs/promises";
import path from "node:path";

function toRelativePath(value: string, cwd: string): string {
  const relativePath = path.relative(cwd, value);
  return relativePath || ".";
}

function normalizePaths(data: unknown, cwd: string): unknown {
  if (typeof data === "string") {
    if (path.isAbsolute(data)) {
      return toRelativePath(data, cwd);
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((value) => normalizePaths(value, cwd));
  }

  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([entryKey, value]) => [
        path.isAbsolute(entryKey) ? toRelativePath(entryKey, cwd) : entryKey,
        normalizePaths(value, cwd),
      ]),
    );
  }

  return data;
}

/**
 * Saves given data to a JSON file.
 * @param data The data to save.
 * @param outputPath The path to the output file.
 * @param cwd
 */
export async function saveToJson(
  data: unknown,
  outputPath: string,
  cwd: string,
): Promise<void> {
  await fs.writeFile(
    outputPath,
    JSON.stringify(normalizePaths(data, cwd), null, 2),
    "utf-8",
  );
}
