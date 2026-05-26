import fs from "fs/promises";
import path from "path";
import { Dirent } from "node:fs";
import pLimit from "p-limit";
import * as readline from "node:readline";

import { TProjectNode } from "@/types/nodes.js";
import { IProjectTree } from "@/types/trees.js";
import { DirNode, FileNode, Node } from "@/core/nodes/index.js";

export interface IMetadata {
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
}

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
  } catch (_e) {
    return 0;
  } finally {
    await fileHandle.close();
  }

  return count;
}

async function getNodeMetadata(
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

async function createFileNode(
  dirPath: string,
  ignore: string[],
  name: string,
  size: number,
): Promise<FileNode> {
  const analyze = await Node.check(dirPath, ignore);

  let lines = 0;

  try {
    lines = await countLines(dirPath);
  } catch (_e) {
    analyze.unreadable = true;
  }

  return new FileNode({ name, path: dirPath, size }, lines, analyze);
}

async function createDirNode(
  dirPath: string,
  ignore: string[],
  name: string,
): Promise<DirNode> {
  const analyze = await Node.check(dirPath, ignore);
  const dir = new DirNode({ name, path: dirPath, size: 0 }, [], analyze);

  if (dir.isExcluded) return dir;

  const entries = await fs
    .readdir(dirPath, { withFileTypes: true })
    .catch(() => []);

  const children = entries.map((entry) => {
    const childPath = path.join(dirPath, entry.name);
    return limit(() => buildTree(childPath, ignore, entry));
  });

  const results = await Promise.allSettled(children);

  dir.children = results
    .filter(
      (r): r is PromiseFulfilledResult<TProjectNode> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  dir.size = dir.children.reduce((s, node) => s + node.size, 0);

  return dir;
}

async function buildTree(
  dirPath: string,
  ignore: string[],
  dirent?: Dirent,
): Promise<TProjectNode> {
  const metadata = await getNodeMetadata(dirPath, dirent);

  if (!metadata)
    return new FileNode(
      { name: path.basename(dirPath), path: dirPath, size: 0 },
      0,
    );

  try {
    await Node.isSymbolicLink(dirent ?? dirPath);

    if (metadata.isDirectory) {
      return await createDirNode(dirPath, ignore, metadata.name);
    }

    return await createFileNode(dirPath, ignore, metadata.name, metadata.size);
  } catch (_e) {
    return new FileNode({ name: "", path: dirPath, size: 0 }, 0);
  }
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
