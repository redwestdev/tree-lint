import { DirNode } from "@/core/nodes/DirNode.js";
import { ILayerNode } from "@/types/nodes.js";
import { ILayerRule } from "@/types/validation.js";

export class LayerNode extends DirNode implements ILayerNode {
  constructor(node: DirNode, rules?: ILayerRule) {
    super(node, node.children);
    this.rules = rules;
  }

  static match(node: DirNode, layers: Set<string>): boolean {
    return layers.has(node.name);
  }

  validate(rules: ILayerRule | undefined = this.rules) {
    // do something
    return super.validate(rules);
  }
}
