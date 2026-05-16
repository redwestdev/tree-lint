import { Node } from "@/core/nodes/Node.js";
import { IDirNode, INode, TAnyNode, TProjectNode } from "@/types/nodes.js";
import {
  IChildrenAmountRule,
  IDirRule,
  INodeRule,
  IValidationResult,
  TAnyRule,
} from "@/types/validation.js";
import { getRules } from "@/core/services/validation/utils.js";
import {
  NODE_RULE_KEYS,
  VIOLATION_MESSAGES,
} from "@/core/services/validation/constants.js";
import { validateNodes } from "@/core/services/validation/validator.js";

export class DirNode extends Node implements IDirNode {
  public children: Array<TProjectNode>;
  private rules?: IDirRule;
  constructor(
    { name, path, ...analyze }: INode,
    children: Array<TProjectNode> = [],
    rules?: IDirRule,
  ) {
    super(name, path);
    this.children = children;
    Object.assign(this, analyze);
    this.rules = rules;
  }

  static async create(
    name: string,
    path: string,
    ignore: string[],
    children: Array<TProjectNode>,
  ): Promise<DirNode> {
    const analyze = await Node.check(path, ignore);

    const data = {
      ...analyze,
      name,
      path,
    };

    return new this(data, children);
  }

  validateChildrenAmount(rule: IChildrenAmountRule): IValidationResult {
    const res =
      this.children.length >= (rule?.min || 1) &&
      this.children.length <= rule.max;

    return {
      result: res,
      ...(!res && {
        violation: {
          type: rule.type,
          path: this.path,
          message: rule.message || VIOLATION_MESSAGES.childrenAmount,
        },
      }),
    };
  }

  validate(
    rules: IDirRule | undefined = this.rules,
  ): Partial<Record<keyof IDirRule, IValidationResult>> {
    // const nodeRules = getRules(rules, NODE_RULE_KEYS);

    let childrenResults;
    this.children.forEach((node: TAnyNode) => {
      childrenResults = node?.validate();
    });

    if (!rules) return childrenResults;


    const supperResults = super.validate(rules);
    const results: Partial<Record<keyof IDirRule, IValidationResult>> = {};
    for (const rule in rules) {
      switch (rule as keyof typeof rules) {
        case "childrenAmount":
          if (rules?.childrenAmount)
            results.childrenAmount = this.validateChildrenAmount(
              rules.childrenAmount,
            );
          break;
        default:
          break;
      }
    }
    const selfResult = { ...supperResults, ...results };




    return {  ...selfResult, ...childrenResults };
  }
}
