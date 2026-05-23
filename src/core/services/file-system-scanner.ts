import fs from "fs/promises";
import path from "path";
import { Dirent } from "node:fs";
import pLimit from "p-limit";
import * as readline from "node:readline";

import { TProjectNode } from "@/types/nodes.js";
import { IProjectTree } from "@/types/trees.js";
import { DirNode, FileNode, Node } from "@/core/nodes/index.js";

const CONCURRENCY_LIMIT = 50;
const limit = pLimit(CONCURRENCY_LIMIT);

async function countLines(filePath: string): Promise<number> {
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
  } finally {
    await fileHandle.close();
  }

  return count;
}

async function buildTree(
  dirPath: string,
  ignore: string[],
  dirent?: Dirent,
): Promise<TProjectNode> {
  await Node.isSymbolicLink(dirent ?? dirPath);

  let name: string;
  let isDirectory: boolean;
  let isFile: boolean;
  let stats: Awaited<ReturnType<typeof fs.stat>> | undefined;

  if (dirent) {
    name = dirent.name;
    isDirectory = dirent.isDirectory();
    isFile = dirent.isFile();
  } else {
    name = path.basename(dirPath);
    stats = await fs.stat(dirPath);
    isDirectory = stats.isDirectory();
    isFile = stats.isFile();
  }

  if (isDirectory) {
    const analyze = await Node.check(dirPath, ignore);
    const dir = new DirNode({ name, path: dirPath, size: 0 }, [], analyze);

    if (dir.isExcluded) return dir;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const children = entries.map((entry) => {
      const childPath = path.join(dirPath, entry.name);
      return limit(() => buildTree(childPath, ignore, entry));
    });

    dir.children = await Promise.all(children);
    dir.size = dir.children.reduce((s, node) => s + node.size, 0);

    return dir;
  }

  if (isFile) {
    const size = Number(stats?.size ?? (await fs.stat(dirPath)).size);

    const analyze = {
      ignored: ignore.length ? Node.shouldIgnore(dirPath, ignore) : false,
      unreadable: false,
      hidden: Node.isHidden(dirPath),
    };

    const lines = await countLines(dirPath);
    return new FileNode({ name, path: dirPath, size }, lines, analyze);
  }

  return new FileNode({ name, path: dirPath, size: 0 }, 0);
}

export async function buildProjectTree(
  roots: string[],
  ignore?: string[],
): Promise<IProjectTree> {
  const trees: TProjectNode[] = [];

  for (const root of roots) {
    trees.push(await buildTree(root, ignore ?? []));
  }

  return {
    generatedAt: new Date().toISOString(),
    trees,
  };
}
