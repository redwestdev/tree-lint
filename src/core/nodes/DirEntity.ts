import { DirNode } from "@/core/nodes/DirNode.js";
import { IDirEntity } from "@/types/nodes.js";
import { IMatchDirectory, ITreeLintConfig } from "@/types/config.js";
import { matchChildren, matchName } from "@/core/services/matcher/utils.js";
import { MATCHING_ENTITY_ERRORS } from "@/core/services/matcher/constants.js";
import { replacePlaceholders } from "@/utils/replace-placeholders.js";
import { getRules } from "@/core/services/validation/utils.js";
import { DIR_RULE_KEYS } from "@/core/services/validation/constants.js";
import { IDirEntityRule } from "@/types/validation.js";

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

  static match(
    entityName: keyof ITreeLintConfig["entities"],
    node: DirNode,
    matches: IMatchDirectory,
    rules?: IDirEntityRule,
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
    const dirRules = getRules(this.rules, DIR_RULE_KEYS);
    const results = super.validate(dirRules);

    if (this.rules?.custom) results.custom = this.rules.custom(this, results);

    return results;
  }
}
