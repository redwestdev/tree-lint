import { DirNode } from "@/core/nodes/DirNode.js";
import { ILayerNode } from "@/types/nodes.js";

export class LayerNode extends DirNode implements ILayerNode {
  constructor(node: DirNode) {
    super(node, node.children);
  }

  static match(node: DirNode, layers: Set<string>): LayerNode | DirNode {
    const isLayerDirectory = layers.has(node.name);

    return isLayerDirectory ? new this(node) : node;
  }

  validate() {
    // do something
    super.validate();
  }
}
