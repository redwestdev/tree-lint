import fs from "fs/promises";
import path from "path";
import { Dirent } from "node:fs";

import { TProjectNode } from "@/types/nodes.js";
import { IProjectTree } from "@/types/trees.js";
import { DirNode, FileNode } from "@/core/nodes/index.js";

const shouldIgnore = (entryName: string, ignore: string[]): boolean => {
  return ignore.includes(entryName) || entryName.startsWith(".");
};

async function buildTree(
  dirPath: string,
  ignore: string[],
  dirent?: Dirent,
): Promise<TProjectNode> {
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
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    // if node is simlink ==> catch with Error, ex. "We are not support SymbolicLinks"
    const filteredEntries = entries.filter(
      (entry) => !shouldIgnore(entry.name, ignore) && !entry.isSymbolicLink(),
    );

    const children: Promise<TProjectNode>[] = filteredEntries.map(
      async (entry) => {
        const childPath = path.join(dirPath, entry.name);
        return await buildTree(childPath, ignore, entry);
      },
    );

    const resolvedChildren: TProjectNode[] = await Promise.all(children);

    return new DirNode(name, dirPath, resolvedChildren);
  }

  return new FileNode(name, dirPath);
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
