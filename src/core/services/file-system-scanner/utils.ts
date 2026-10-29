import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import * as readline from "node:readline";

import { parseSync } from "oxc-parser";
import { ResolverFactory } from "oxc-resolver";

import type { IASTData } from "@/types/nodes.js";

export interface IMetadata {
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
}

const FLAG = "@tree-lint";

// TODO: get aliases from config
const resolver = new ResolverFactory({
  extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  tsconfig: { configFile: `${process.cwd()}/tsconfig.json` },
});

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

export async function getASTData(filePath: string): Promise<IASTData | null> {
  try {
    const code = await fs.readFile(filePath, "utf-8");
    const result = parseSync(filePath, code);

    if (result.errors.length > 0) {
      console.error(result.errors);
      return null;
    }

    const comments: string[] = [...result.comments].reduce<string[]>(
      (acc, c) => {
        if (c.value.trim().startsWith(FLAG)) acc.push(c.value.trim());
        return acc;
      },
      [],
    );

    const imports = [...result.module.staticImports].flatMap((item) => {
      const result = resolver.resolveFileSync(
        filePath,
        item.moduleRequest.value,
      );

      if (!result?.path || result?.error) return "unresolved";

      return result.path;
    });

    return { imports, comments };
  } catch (_e) {
    return null;
  }
}
