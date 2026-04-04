import { DirNode } from "@/core/nodes/DirNode.js";
import { IGroupNode } from "@/types/nodes.js";

export class GroupNode extends DirNode implements IGroupNode {
  private readonly rules: Record<string, string>;

  constructor(node: DirNode, rules: Record<string, string>) {
    super(node.name, node.path, node.children);
    this.rules = rules;
  }

  validate() {
    console.log("Validation rules:", this.rules);
  }
}
