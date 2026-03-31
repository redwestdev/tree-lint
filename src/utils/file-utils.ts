import fs from "fs/promises";
import { AnyTree } from "../types/index.js";

/**
 * Saves given data to a JSON file.
 * @param data The data to save.
 * @param outputPath The path to the output file.
 */
export async function saveToJson(
  data: AnyTree,
  outputPath: string,
): Promise<void> {
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf-8");
}
