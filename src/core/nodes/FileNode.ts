import { IFileNode, INode } from "@/types/nodes.js";
import { INodeAnalyze, Node } from "@/core/nodes/Node.js";
import {
  ICustomFileRule,
  IFileRule,
  IFileRuleBase,
  ILineCountRule,
  IValidationResult,
} from "@/types/validation.js";
import { createValidationResult } from "@/utils/create-validation-result.js";
import { formatCustomError } from "@/utils/format-custom-error.js";

export class FileNode<TRule extends IFileRuleBase = IFileRule>
  extends Node<TRule>
  implements IFileNode<TRule>
{
  public extension: string;
  public lines: number;

  constructor(
    { name, path, size }: INode,
    lines: number = 0,
    analyze?: INodeAnalyze,
    rules?: TRule,
  ) {
    super(name, path, size);
    Object.assign(this, analyze);
    this.lines = lines;
    this.extension = path.split(".").pop() || "";
    this._rules = rules;
  }

  validateLinesCount(rule: ILineCountRule): IValidationResult {
    const res = this.lines >= (rule?.min || 1) && this.lines <= rule.max;

    return createValidationResult(res, this.path, rule, "lines");
  }

  validateCustom(
    rule: unknown,
    results: Partial<Record<string, IValidationResult>>[],
  ): IValidationResult {
    const r = rule as ICustomFileRule;

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
    if (!rules) return [];

    const r = rules as unknown as IFileRule;
    const superResult = super.validate(rules);
    const selfResult: Partial<Record<string, IValidationResult>> = {};

    for (const rule in rules) {
      switch (rule as keyof typeof rules) {
        case "lineCount":
          if (r.lineCount)
            selfResult.lineCount = this.validateLinesCount(r.lineCount);
          break;
        case "custom":
          if (r.custom)
            selfResult.custom = this.validateCustom(r.custom, superResult);
          break;
        default:
          break;
      }
    }

    return [...superResult, selfResult];
  }
}
