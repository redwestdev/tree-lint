import { DirNode } from "@/core/nodes/DirNode.js";
import { IGroupNode } from "@/types/nodes.js";
import { validationLogger } from "@/utils/index.js";

export class GroupNode extends DirNode implements IGroupNode {
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
}
