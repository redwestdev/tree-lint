import { INodeAnalyze, Node } from "@/core/nodes/Node.js";
import { IDirNode, INode, TAnyNode, TProjectNode } from "@/types/nodes.js";
import {
  IChildrenAmountRule,
  IDirRule,
  IValidationResult,
  TAnyRule,
} from "@/types/validation.js";
import { VIOLATION_MESSAGES } from "@/core/services/validation/constants.js";

export class DirNode extends Node implements IDirNode {
  public children: Array<TProjectNode>;

  constructor(
    { name, path }: INode,
    children: Array<TProjectNode> = [],
    analyze?: INodeAnalyze,
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

    const node = new Node(name, path);

    return new this(node, children, analyze);
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
  ): Partial<Record<keyof TAnyRule, IValidationResult>>[] {
    const childrenResults: Partial<
      Record<keyof TAnyRule, IValidationResult>
    >[] = this.children.reduce(
      (
        prev: Partial<Record<keyof TAnyRule, IValidationResult>>[],
        node: TAnyNode,
      ) => {
        const res = node?.validate?.();

        if (!res) return prev;

        prev.push(...res);
        return prev;
      },
      [],
    );

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
    const selfResult = [...supperResults, results];

    return [...selfResult, ...childrenResults];
  }
}
