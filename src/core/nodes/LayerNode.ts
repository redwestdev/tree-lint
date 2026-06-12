import { DirNode } from "@/core/nodes/DirNode.js";
import { ILayerNode } from "@/types/nodes.js";
import {
  ICustomLayerRule,
  IDirRuleBase,
  ILayerRule,
  IValidationResult,
} from "@/types/validation.js";
import { createValidationResult } from "@/utils/create-validation-result.js";
import { formatCustomError } from "@/utils/format-custom-error.js";

export class LayerNode extends DirNode<ILayerRule> implements ILayerNode {
  constructor(node: DirNode<IDirRuleBase>, rules?: ILayerRule) {
    super(node, node.children);
    this.rules = rules;
  }

  static match(node: DirNode<IDirRuleBase>, layers: Set<string>): boolean {
    return layers.has(node.name);
  }

  override validateCustom(
    rule: unknown,
    results: Partial<Record<string, IValidationResult>>[],
  ): IValidationResult {
    const r = rule as ICustomLayerRule;

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
    rules: ILayerRule | undefined = this.rules,
  ): Partial<Record<string, IValidationResult>>[] {
    const r = rules as unknown as ILayerRule;
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
