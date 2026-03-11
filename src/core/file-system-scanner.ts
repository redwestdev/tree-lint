import fs from "fs/promises";
import path from "path";
import chalk from "chalk";

export interface ProjectNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: ProjectNode[];
}

export interface ProjectTreeResult {
  generatedAt: string;
  trees: ProjectNode[];
}

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

  async getFilesInDirectory(dirPath: string): Promise<ProjectNode[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      const filtered = entries.filter(
        (entry) => !this.shouldIgnore(entry.name),
      );

      return filtered.map((entry) => ({
        path: path.join(dirPath, entry.name),
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
      }));
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return [];
    }
  }

  async buildTree(dirPath: string): Promise<ProjectNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    const relativePath =
      "/" + path.relative(this.cwd, dirPath).split(path.sep).join("/");

    if (!stats.isDirectory()) {
      return {
        name,
        path: relativePath,
        type: "file",
      };
    }

    const entries = await this.getFilesInDirectory(dirPath);
    const children: ProjectNode[] = [];

    for (const entry of entries) {
      const childNode = await this.buildTree(entry.path);
      children.push(childNode);
    }

    return {
      name,
      path: relativePath,
      type: "directory",
      children: children.length > 0 ? children : undefined,
    };
  }

  async scan(): Promise<ProjectTreeResult> {
    const rootsToScan = this.roots.length > 0 ? this.roots : ["."];
    const allTrees: ProjectNode[] = [];

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
