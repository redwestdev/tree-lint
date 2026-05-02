import path from "path";
import { Dirent } from "node:fs";
import fs from "fs/promises";
import { constants } from "node:fs/promises";
import mm from "micromatch";
import { INode } from "@/types/nodes.js";

export class Node implements INode {
  public isValid: boolean = true;
  public errors: string[] = [];
  public warnings: string[] = [];
  public name: string;
  public path: string;
  public ignored: boolean = false;
  public unreadable: boolean = false;
  public hidden: boolean = false;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
  }

  get isExcluded(): boolean {
    return this.ignored || this.unreadable;
  }

  addWarning(warn: string) {
    this.warnings.push(warn);
  }

  addError(err: string) {
    this.errors.push(err);
  }

  setValidity(valid: boolean) {
    this.isValid = valid;
  }

  static async isBlockedAccess(dirPath: string): Promise<boolean> {
    try {
      await fs.access(dirPath, constants.R_OK);
      return false;
    } catch (_e) {
      return true;
    }
  }

  static isHidden(dirPath: string): boolean {
    const name = path.basename(dirPath);
    return name.startsWith(".");
  }

  static shouldIgnore(dirPath: string, ignore: string[]) {
    const fullPath = dirPath.replace(/\\/g, "/");
    return mm.isMatch(fullPath, ignore);
  }

  static async isSymbolicLink(node: string | Dirent) {
    const isString = typeof node === "string";

    const isLink = isString
      ? (await fs.lstat(node)).isSymbolicLink()
      : node.isSymbolicLink();

    if (isLink) {
      const nodePath = isString ? node : path.join(node.parentPath, node.name);

      throw new Error(
        `Node ${nodePath} is a symbolic link; we do not support them for now.`,
      );
    }
  }

  static check = async (
    dirPath: string,
    ignore?: string[],
    dirent?: Dirent,
  ) => {
    await this.isSymbolicLink(dirent ?? dirPath);

    return {
      ignored: ignore?.length ? this.shouldIgnore(dirPath, ignore) : false,
      unreadable: await this.isBlockedAccess(dirPath),
      hidden: this.isHidden(dirPath),
    };
  };

  validate() {}
}
