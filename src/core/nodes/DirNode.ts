import { Node } from "@/core/nodes/Node.js";
import { IDirNode, INode, TProjectNode } from "@/types/nodes.js";
import { IDirRule, INodeRule } from "@/types/config.js";
import {
  getRules,
  validateChildrenAmount,
} from "@/core/services/validation/utils.js";
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

  validate(rules?: IDirRule) {
    for (const rule in rules) {
      switch (rule) {
        case "childrenAmount":
          if (
            !validateChildrenAmount(
              this.children,
              rules[rule]?.max ?? 1,
              rules[rule]?.min ?? 1,
            )
          ) {
            this.registerViolation(
              rules[rule]?.type || "warning",
              rules[rule]?.message || VIOLATION_MESSAGES[rule],
            );
          }
          break;
      }
    }

    const nodeRules = getRules(rules, NODE_RULE_KEYS);
    super.validate(nodeRules);
  }
}
