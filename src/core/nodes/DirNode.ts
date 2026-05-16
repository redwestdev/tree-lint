import { Node } from "@/core/nodes/Node.js";
import { IDirNode, INode, TProjectNode } from "@/types/nodes.js";
import {
  IChildrenAmountRule,
  IDirRule,
  IValidationResult,
  TAnyRule,
} from "@/types/validation.js";
import { getRules } from "@/core/services/validation/utils.js";
import {
  NODE_RULE_KEYS,
  VIOLATION_MESSAGES,
} from "@/core/services/validation/constants.js";

export class DirNode extends Node implements IDirNode {
  public children: Array<TProjectNode>;

  constructor(
    { name, path, ...analyze }: INode,
    children: Array<TProjectNode> = [],
  ) {
    super(name, path);
    this.children = children;
    Object.assign(this, analyze);
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

  validate(rules?: IDirRule) {
    const nodeRules = getRules(rules, NODE_RULE_KEYS);
    const results = super.validate(nodeRules);

    for (const rule in rules) {
      switch (rule) {
        case "childrenAmount":
          if (rules?.childrenAmount)
            results.childrenAmount = this.validateChildrenAmount(
              rules.childrenAmount,
            );
          break;
        case "children":
        default:
          break;
      }
    }

    return results;
  }
}
