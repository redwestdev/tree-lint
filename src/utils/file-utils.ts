import fs from "node:fs/promises";
import path from "node:path";

import type { TAnyTree } from "@/types/trees.js";

/**
 * Saves given data to a JSON file.
 * @param data The data to save.
 * @param outputPath The path to the output file.
 * @param cwd
 */
export async function saveToJson(
  data: TAnyTree,
  outputPath: string,
  cwd: string,
): Promise<void> {
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      data,
      (key: string, value: string) => {
        return key === "path" ? path.relative(cwd, value) : value;
      },
      2,
    ),
    "utf-8",
  );
}
