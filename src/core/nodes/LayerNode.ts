import { DirNode } from "@/core/nodes/DirNode.js";
import { ILayerNode } from "@/types/nodes.js";
import {
  ICustomLayerRule,
  IDirRuleBase,
  ILayerRule,
  IValidationResult,
} from "@/types/validation.js";
import { createValidationResult } from "@/utils/create-validation-result.js";

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
    const res = r.callback(this, results);

    return createValidationResult(res, this.path, r, "custom");
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
