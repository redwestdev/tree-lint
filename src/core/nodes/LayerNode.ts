import { DirNode } from "@/core/nodes/DirNode.js";
import { ILayerNode } from "@/types/nodes.js";
import { validationLogger } from "@/utils/index.js";

export class LayerNode extends DirNode implements ILayerNode {
  private readonly rules: Record<string, string>;

  constructor(node: DirNode, rules: Record<string, string>) {
    super(node.name, node.path, node.children);
    this.rules = rules;
  }

  validate() {
    if (!this.isValid) {
      validationLogger(this.path, this.warnings, this.errors);
    }
  }

  static match(node: DirNode, layers: Set<string>): LayerNode | DirNode {
    const rules: Record<string, string> = {};
    const isLayerDirectory = layers.has(node.name);

    return isLayerDirectory ? new this(node, rules) : node;
  }
}
