import { INodeAnalyze, Node } from "@/core/nodes/Node.js";
import { IDirNode, INode, TAnyNode } from "@/types/nodes.js";
import {
  IChildrenAmountRule,
  ICustomDirRule,
  IDirRule,
  IDirRuleBase,
  IValidationResult,
} from "@/types/validation.js";
import { createValidationResult } from "@/utils/create-validation-result.js";
import { formatCustomError } from "@/utils/format-custom-error.js";

export class DirNode<TRule extends IDirRuleBase = IDirRule>
  extends Node<TRule>
  implements IDirNode<TRule>
{
  public children: Array<TAnyNode>;

  constructor(
    { name, path, size }: INode,
    children: Array<TAnyNode> = [],
    analyze?: INodeAnalyze,
    rules?: TRule,
  ) {
    super(name, path, size);
    this.children = children;
    Object.assign(this, analyze);
    this._rules = rules;
  }

  validateChildrenAmount(rule: IChildrenAmountRule): IValidationResult {
    const res =
      this.children.length >= (rule?.min || 1) &&
      this.children.length <= rule.max;

    return createValidationResult(res, this.path, rule, "childrenAmount");
  }

  validateCustom(
    rule: unknown,
    results: Partial<Record<string, IValidationResult>>[],
  ): IValidationResult {
    const r = rule as ICustomDirRule;

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
    rules: TRule | undefined = this.rules,
  ): Partial<Record<string, IValidationResult>>[] {
    const childrenResults: Partial<Record<string, IValidationResult>>[] =
      this.children.reduce(
        (
          prev: Partial<Record<string, IValidationResult>>[],
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

    const r = rules as unknown as IDirRule;
    const superResults = super.validate(rules);
    const results: Partial<Record<string, IValidationResult>> = {};

    for (const rule in rules) {
      switch (rule as keyof typeof rules) {
        case "childrenAmount":
          if (r.childrenAmount)
            results.childrenAmount = this.validateChildrenAmount(
              r.childrenAmount,
            );
          break;
        case "custom":
          if (r.custom)
            results.custom = this.validateCustom(r.custom, superResults);
          break;
        default:
          break;
      }
    }
    const selfResult = [...superResults, results];

    return [...selfResult, ...childrenResults];
  }
}
