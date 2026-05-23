import path from "path";
import { Dirent } from "node:fs";
import fs from "fs/promises";
import { constants } from "node:fs/promises";
import mm from "micromatch";
import { INode } from "@/types/nodes.js";
import {
  INameLengthRule,
  INameRule,
  INodeRule,
  IValidationResult,
  ISizeRule,
  IBaseRule,
} from "@/types/validation.js";
import { createValidationResult } from "@/utils/create-validation-result.js";

export interface INodeAnalyze {
  ignored: boolean;
  unreadable: boolean;
  hidden: boolean;
}

export class Node<TRule extends INodeRule = INodeRule> implements INode<TRule> {
  public name: string;
  public path: string;
  public _size: number = 0;
  public _rules?: TRule;
  public _isValid: boolean = true;
  public ignored: boolean = false;
  public unreadable: boolean = false;
  public hidden: boolean = false;

  constructor(name: string, path: string, size: number) {
    this.name = name;
    this.path = path;
    this._size = size;
  }

  get isExcluded(): boolean {
    return this.ignored || this.unreadable;
  }

  get size(): number {
    return this._size;
  }

  set size(value: number) {
    this._size = value;
  }

  get rules(): TRule | undefined {
    return this._rules;
  }

  set rules(rules: TRule | undefined) {
    this._rules = rules;
  }

  get isValid(): boolean {
    return this._isValid;
  }

  set isValid(value: boolean) {
    this._isValid = value;
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
  ): Promise<INodeAnalyze> => {
    await this.isSymbolicLink(dirent ?? dirPath);

    return {
      ignored: ignore?.length ? this.shouldIgnore(dirPath, ignore) : false,
      unreadable: await this.isBlockedAccess(dirPath),
      hidden: this.isHidden(dirPath),
    };
  };

  validateNameLength(rule: INameLengthRule): IValidationResult {
    const res =
      this.name.length >= (rule?.min || 1) && this.name.length <= rule.max;

    return createValidationResult(res, this.path, rule, "nameLength");
  }

  validateName(rule: INameRule): IValidationResult {
    const res = mm.isMatch(this.name, rule.pattern || "");
    return createValidationResult(res, this.path, rule, "name");
  }

  validateSize(rule: ISizeRule): IValidationResult {
    const fileSize = this._size / 1024;
    const res = fileSize >= (rule?.min || 1) && fileSize <= rule.max;

    return createValidationResult(res, this.path, rule, "size");
  }

  validateEmpty(rule: IBaseRule) {
    const res = this._size !== 0;
    return createValidationResult(res, this.path, rule, "isEmpty");
  }

  validate(rules?: TRule): Partial<Record<string, IValidationResult>>[] {
    if (!rules) return [];

    const result: Partial<Record<string, IValidationResult>> = {};

    for (const rule in rules) {
      switch (rule as keyof typeof rules) {
        case "nameLength":
          if (rules.nameLength)
            result.nameLength = this.validateNameLength(rules.nameLength);
          break;
        case "name":
          if (rules.name) result.name = this.validateName(rules.name);
          break;
        case "size":
          if (rules.size) result.size = this.validateSize(rules.size);
          break;
        case "isEmpty":
          if (rules.isEmpty) result.isEmpty = this.validateEmpty(rules.isEmpty);
          break;
        default:
          break;
      }
    }

    return [result];
  }
}
