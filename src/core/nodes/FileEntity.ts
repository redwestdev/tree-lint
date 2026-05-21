import { FileNode } from "@/core/nodes/FileNode.js";
import { IFileEntity } from "@/types/nodes.js";
import { IMatchFile, ITreeLintConfig } from "@/types/config.js";
import { matchName } from "@/core/services/matcher/utils.js";
import { MATCHING_ENTITY_ERRORS } from "@/core/services/matcher/constants.js";
import { replacePlaceholders } from "@/utils/replace-placeholders.js";
import {
  IFileEntityRule,
  IValidationResult,
  IViolation,
} from "@/types/validation.js";

export class FileEntity extends FileNode implements IFileEntity {
  public readonly entity: keyof ITreeLintConfig["entities"];

  constructor(
    node: FileNode,
    entity: keyof ITreeLintConfig["entities"],
    rules?: IFileEntityRule,
  ) {
    super(node);
    this.rules = rules;
    this.entity = entity;
  }

  static createNew(
    node: FileNode,
    entity: keyof ITreeLintConfig["entities"],
    rules?: IFileEntityRule,
  ): FileEntity {
    // FIXME: do we really need this?
    return new this(node, entity, rules);
  }

  static match(
    node: FileNode,
    matches: IMatchFile,
    entityName: keyof ITreeLintConfig["entities"],
  ): IValidationResult[] {
    if ("custom" in matches) {
      // TODO: check with user's callback
      return [{ result: true }]; // callback result
    }

    const result: Record<string, boolean> = {
      name: matchName(node.name, matches.name),
    };
    const isMatch = Object.values(result).every(Boolean);

    if (isMatch) return [{ result: true }];

    const log: IValidationResult[] = [];

    if (!isMatch && Object.values(result).some(Boolean)) {
      for (const key in result) {
        if (!result[key]) {
          const warn = replacePlaceholders(MATCHING_ENTITY_ERRORS[key], {
            entity: entityName,
          });

          const violation: IViolation = {
            type: "warning",
            path: node.path,
            message: warn,
          };

          log.push({ result: false, violation });
        }
      }
    }

    return log;
  }

  validate(
    rules: IFileEntityRule | undefined = this.rules,
  ): Partial<Record<keyof IFileEntityRule, IValidationResult>>[] {
    return super.validate(rules);
  }
}
