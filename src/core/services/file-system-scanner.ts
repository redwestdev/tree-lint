import fs from "fs/promises";
import path from "path";
import chalk from "chalk";

import { TProjectNode } from "@/types/nodes.js";
import { IProjectTree } from "@/types/trees.js";
import { DirNode, FileNode } from "@/core/nodes/index.js";

export class FileSystemScanner {
  protected ignore: string[];
  protected roots: string[];
  protected cwd: string;

  constructor({
    roots = [],
    ignore = [],
    cwd = process.cwd(),
  }: { roots?: string[]; ignore?: string[]; cwd?: string } = {}) {
    this.roots = roots;
    this.ignore = ignore;
    this.cwd = cwd;
  }

  private shouldIgnore(entryName: string): boolean {
    return this.ignore.includes(entryName) || entryName.startsWith(".");
  }

  async getFilesInDirectory(dirPath: string): Promise<TProjectNode[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      const filtered = entries.filter(
        (entry) => !this.shouldIgnore(entry.name),
      );

      return filtered.map((entry) => {
        const nodePath: string = path.join(dirPath, entry.name);
        const name = entry.name;
        return entry.isDirectory()
          ? new DirNode(name, nodePath)
          : new FileNode(name, nodePath);
      });
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return [];
    }
  }

  async buildTree(dirPath: string): Promise<TProjectNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    const relativePath =
      "/" + path.relative(this.cwd, dirPath).split(path.sep).join("/");

    if (!stats.isDirectory()) {
      return new FileNode(name, relativePath);
    }

    const entries = await this.getFilesInDirectory(dirPath);
    const children: TProjectNode[] = [];

    for (const entry of entries) {
      const childNode = await this.buildTree(entry.path);
      children.push(childNode);
    }

    return new DirNode(name, relativePath, children);
  }

  async scan(): Promise<IProjectTree> {
    const rootsToScan = this.roots.length > 0 ? this.roots : ["."];
    const allTrees: TProjectNode[] = [];

    for (const root of rootsToScan) {
      const tree = await this.buildTree(root);
      allTrees.push(tree);
    }

    return {
      generatedAt: new Date().toISOString(),
      trees: allTrees,
    };
  }

  logScanPlan() {
    console.log(chalk.bold.green("✅ Will scan the following paths:"));
    this.roots.forEach((r: string) => console.log("  " + chalk.cyan(r)));

    if (this.ignore?.length) {
      console.log(chalk.bold.yellow("⚠️ Will ignore:"));
      this.ignore.forEach((i: string) => console.log("  " + chalk.magenta(i)));
    } else {
      console.log(chalk.bold.yellow("⚠️ No ignored paths."));
    }
  }
}
