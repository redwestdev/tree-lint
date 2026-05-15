import { DirNode } from "@/core/nodes/DirNode.js";
import { IDirEntity } from "@/types/nodes.js";
import {
  IMatchDirectory,
  ITreeLintConfig,
  TEntityRule,
} from "@/types/config.js";
import { matchChildren, matchName } from "@/core/services/matcher/utils.js";
import { MATCHING_ENTITY_ERRORS } from "@/core/services/matcher/constants.js";
import { replacePlaceholders } from "@/utils/replace-placeholders.js";
import { getRules } from "@/core/services/validation/utils.js";
import {
  DIR_RULE_KEYS,
  VIOLATION_MESSAGES,
} from "@/core/services/validation/constants.js";

export class DirEntity extends DirNode implements IDirEntity {
  private readonly rules: TEntityRule | undefined;
  public readonly entity: keyof ITreeLintConfig["entities"];

  constructor(
    node: DirNode,
    entity: keyof ITreeLintConfig["entities"],
    rules?: TEntityRule,
  ) {
    super(node, node.children);
    this.rules = rules;
    this.entity = entity;
  }

  static match(
    entityName: keyof ITreeLintConfig["entities"],
    node: DirNode,
    matches: IMatchDirectory,
    rules?: TEntityRule,
  ): DirEntity | DirNode {
    if ("custom" in matches) {
      // TODO: check with user's callback
      return node; // callback result
    }

    const result: Record<string, boolean> = {
      name: matchName(node.name, matches.name),
    };

    if (matches.children) {
      result.children = matchChildren(node.children, matches.children);
    }
    const isMatch = Object.values(result).every(Boolean);

    if (!isMatch && Object.values(result).some(Boolean)) {
      for (const key in result) {
        if (!result[key]) {
          const warn = replacePlaceholders(MATCHING_ENTITY_ERRORS[key], {
            entity: entityName,
          });
          node.addWarning(warn);
        }
      }
    }
    // log warning
    return isMatch ? new this(node, entityName, rules) : node;
  }

  validate() {
    if (this.rules?.type !== "directory") {
      this.setValidity(false);
      this.addError(
        "There are different types for match and validation entity. Please, check your config",
      );

      super.validate();
      return;
    }

    if (this.rules.custom) {
      const customRule = this.rules.custom(this);

      if (
        customRule !== null &&
        typeof customRule === "object" &&
        "type" in customRule
      ) {
        this.registerViolation(
          customRule.type,
          customRule.message || VIOLATION_MESSAGES.custom,
        );
      } else if (customRule !== true) {
        this.addWarning(
          "Invalid return statement from custom rule. Please, check your config",
        );
      }
    }

    const dirRules = getRules(this.rules, DIR_RULE_KEYS);
    super.validate(dirRules);
  }
}
