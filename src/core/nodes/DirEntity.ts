import { DirNode } from "@/core/nodes/DirNode.js";
import { MATCHING_ENTITY_ERRORS } from "@/core/services/matcher/constants.js";
import { matchChildren, matchName } from "@/core/services/matcher/utils.js";
import type { IMatchDirectory, ITreeLintConfig } from "@/types/config.js";
import type { IDirEntity } from "@/types/nodes.js";
import type {
  ICustomDirEntityRule,
  IDirEntityRule,
  IDirRuleBase,
  IValidationResult,
  IViolation,
} from "@/types/validation.js";
import { createValidationResult } from "@/utils/create-validation-result.js";
import { formatCustomError } from "@/utils/format-custom-error.js";
import { replacePlaceholders } from "@/utils/replace-placeholders.js";

export class DirEntity extends DirNode<IDirEntityRule> implements IDirEntity {
  public readonly entity: keyof ITreeLintConfig["entities"];

  constructor(
    node: DirNode<IDirRuleBase>,
    entity: keyof ITreeLintConfig["entities"],
    rules?: IDirEntityRule,
  ) {
    super(node, node.children);
    this._rules = rules;
    this.entity = entity;
  }

  static match(
    node: DirNode<IDirRuleBase>,
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

    if (log.length === 0) {
      log.push({ result: false });
    }

    return log;
  }

  override validateCustom(
    rule: unknown,
    results: Partial<Record<string, IValidationResult>>[],
  ): IValidationResult {
    const r = rule as ICustomDirEntityRule;

    try {
      const res = r.callback(this, results);

      if (typeof res !== "boolean") {
        const error = new Error(
          `Custom rule must return a boolean, but returned ${typeof res}`,
        );
        const errorRule = formatCustomError(error);
        return createValidationResult(false, this.path, errorRule);
      }

      return createValidationResult(res, this.path, r, "custom");
    } catch (e) {
      const errorRule = formatCustomError(e);
      return createValidationResult(false, this.path, errorRule);
    }
  }

  validate(
    rules: IDirEntityRule | undefined = this.rules,
  ): Partial<Record<string, IValidationResult>>[] {
    const r = rules as unknown as IDirEntityRule;
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
