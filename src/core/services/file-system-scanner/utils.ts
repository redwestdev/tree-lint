import fs from "fs/promises";
import path from "path";
import { Dirent } from "node:fs";
import * as readline from "node:readline";

export interface IMetadata {
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
}

export async function countLines(filePath: string): Promise<number> {
  const fileHandle = await fs.open(filePath, "r");
  let count = 0;

  try {
    const rl = readline.createInterface({
      input: fileHandle.createReadStream(),
      crlfDelay: Infinity,
    });

    for await (const _line of rl) {
      count++;
    }
  } catch (_e) {
    return 0;
  } finally {
    await fileHandle.close();
  }

  return count;
}

export async function getNodeMetadata(
  dirPath: string,
  dirent?: Dirent,
): Promise<IMetadata | null> {
  try {
    const name = dirent ? dirent.name : path.basename(dirPath);
    const stats = await fs.stat(dirPath);

    return {
      name,
      size: stats.size,
      isDirectory: dirent ? dirent.isDirectory() : stats.isDirectory(),
      isFile: dirent ? dirent.isFile() : stats.isFile(),
    };
  } catch (_e) {
    return null;
  }
}
