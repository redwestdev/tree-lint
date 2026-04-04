import fs from "fs/promises";
import { TAnyTree } from "@/types/trees.js";

/**
 * Saves given data to a JSON file.
 * @param data The data to save.
 * @param outputPath The path to the output file.
 */
export async function saveToJson(
  data: TAnyTree,
  outputPath: string,
): Promise<void> {
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf-8");
}
