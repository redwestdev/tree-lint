import { DirNode } from "@/core/nodes/DirNode.js";
import { IGroupNode } from "@/types/nodes.js";
import { ITreeLintConfig } from "@/types/config.js";
import { matchChildren, matchName } from "@/core/services/matcher/utils.js";

import { MATCHING_GROUP_ERRORS } from "@/core/services/matcher/constants.js";
import { FileEntity } from "@/core/nodes/FileEntity.js";
import { DirEntity } from "@/core/nodes/DirEntity.js";
import {
  ICustomGroupRule,
  IDirRuleBase,
  IGroupRule,
  IValidationResult,
  IViolation,
} from "@/types/validation.js";
import { createValidationResult } from "@/utils/create-validation-result.js";

export class GroupNode extends DirNode<IGroupRule> implements IGroupNode {
  constructor(node: DirNode<IDirRuleBase>, rules?: IGroupRule) {
    super(node, node.children);
    this.rules = rules;
  }

  static match(
    node: DirNode<IDirRuleBase>,
    config?: ITreeLintConfig["groups"],
  ): IValidationResult[] {
    if (!node.children.length) return [{ result: false }];

    const children: Set<string | undefined> = new Set(
      node.children
        .map((child) => {
          if (child instanceof GroupNode) {
            return "group";
          } else if (
            child instanceof FileEntity ||
            child instanceof DirEntity
          ) {
            return child.entity;
          } else return undefined;
        })
        .filter((name) => !!name),
    );

    if (children.size === 0) return [{ result: false }];

    const result: Record<string, boolean> = {
      hasValidChildren: children.size >= 1,
    };

    if (config?.name) result.name = matchName(node.name, config.name);
    if (config?.children)
      result.children = matchChildren(node.children, config.children);

    const isMatch = Object.values(result).every(Boolean);

    if (isMatch) return [{ result: true }];

    const log: IValidationResult[] = [];

    if (!isMatch && Object.values(result).some(Boolean)) {
      for (const key in result) {
        if (!result[key]) {
          const violation: IViolation = {
            type: "warning",
            path: node.path,
            message: MATCHING_GROUP_ERRORS[key],
          };

          log.push({ result: false, violation });
        }
      }
    }

    if (log.length === 0) {
      log.push({ result: false });
    }

    return log;
  }

  override validateCustom(
    rule: unknown,
    results: Partial<Record<string, IValidationResult>>[],
  ): IValidationResult {
    const r = rule as ICustomGroupRule;
    const res = r.callback(this, results);

    return createValidationResult(res, this.path, r, "custom");
  }

  validate(
    rules: IGroupRule | undefined = this.rules,
  ): Partial<Record<string, IValidationResult>>[] {
    const r = rules as unknown as IGroupRule;
    const { custom, ...rulesWithoutCustom } = r || {};

    const results: Partial<Record<string, IValidationResult>>[] =
      super.validate(rulesWithoutCustom);

    const selfResult: Partial<Record<string, IValidationResult>> = {};

    for (const rule in rules) {
      switch (rule as keyof typeof rules) {
        case "custom":
          if (custom) selfResult.custom = this.validateCustom(custom, results);
          break;
        default:
          break;
      }
    }

    return [...results, selfResult];
  }
}
