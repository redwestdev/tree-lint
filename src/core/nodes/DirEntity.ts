import { DirNode } from "@/core/nodes/DirNode.js";
import { IDirEntity } from "@/types/nodes.js";
import { IMatchDirectory, ITreeLintConfig } from "@/types/config.js";
import { matchChildren, matchName } from "@/core/services/matcher/utils.js";
import { MATCHING_ENTITY_ERRORS } from "@/core/services/matcher/constants.js";
import { replacePlaceholders } from "@/utils/replace-placeholders.js";
import {
  IDirEntityRule,
  IValidationResult,
  IViolation,
  TAnyRule,
} from "@/types/validation.js";

export class DirEntity extends DirNode implements IDirEntity {
  private readonly rules: IDirEntityRule | undefined;
  public readonly entity: keyof ITreeLintConfig["entities"];

  constructor(
    node: DirNode,
    entity: keyof ITreeLintConfig["entities"],
    rules?: IDirEntityRule,
  ) {
    super(node, node.children);
    this.rules = rules;
    this.entity = entity;
  }

  static create(
    node: DirNode,
    entity: keyof ITreeLintConfig["entities"],
    rules?: IDirEntityRule,
  ): DirEntity {
    // TODO: append rules for children
    return new this(node, entity, rules);
  }

  static match(
    node: DirNode,
    matches: IMatchDirectory,
    entityName: keyof ITreeLintConfig["entities"],
  ): IValidationResult[] {
    if ("custom" in matches) {
      // TODO: check with user's callback
      return [{ result: true }]; // callback result
    }

    const result: Record<string, boolean> = {
      name: matchName(node.name, matches.name),
    };

    if (matches.children) {
      result.children = matchChildren(node.children, matches.children);
    }
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
    rules: IDirEntityRule | undefined = this.rules,
  ): Partial<Record<keyof TAnyRule, IValidationResult>>[] {
    // if (this.rules?.custom) results.custom = this.rules.custom(this, results);

    return super.validate(rules);
  }
}
