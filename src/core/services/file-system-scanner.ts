import fs from "fs/promises";
import path from "path";
import { Dirent } from "node:fs";
import pLimit from "p-limit";

import { TProjectNode } from "@/types/nodes.js";
import { IProjectTree } from "@/types/trees.js";
import { DirNode, FileNode, Node } from "@/core/nodes/index.js";

const CONCURRENCY_LIMIT = 50;
const limit = pLimit(CONCURRENCY_LIMIT);

async function buildTree(
  dirPath: string,
  ignore: string[],
  dirent?: Dirent,
): Promise<TProjectNode> {
  await Node.isSymbolicLink(dirent ?? dirPath);

  let name, isDirectory;

  if (dirent) {
    name = dirent.name;
    isDirectory = dirent.isDirectory();
  } else {
    name = path.basename(dirPath);

    const stats = await fs.stat(dirPath);
    isDirectory = stats.isDirectory();
  }

  if (isDirectory) {
    const dir = await DirNode.create(name, dirPath, ignore, []);

    if (dir.isExcluded) return dir;

    const entries = await limit(() =>
      fs.readdir(dirPath, { withFileTypes: true }),
    );

    const children = entries.map((entry) => {
      const childPath = path.join(dirPath, entry.name);
      return buildTree(childPath, ignore, entry);
    });

    dir.children = await Promise.all(children);
    return dir;
  }

  return await FileNode.create(name, dirPath, ignore);
}

export async function buildProjectTree(
  roots: string[],
  ignore?: string[],
): Promise<IProjectTree> {
  const allTrees: TProjectNode[] = [];

  for (const root of roots) {
    const tree = await buildTree(root, ignore ?? []);
    allTrees.push(tree);
  }

  return {
    generatedAt: new Date().toISOString(),
    trees: allTrees,
  };
}
