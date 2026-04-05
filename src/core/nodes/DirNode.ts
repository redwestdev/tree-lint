import { Node } from "@/core/nodes/Node.js";
import { IDirNode, TProjectNode } from "@/types/nodes.js";

export class DirNode extends Node implements IDirNode {
  public children: Array<TProjectNode>;

  constructor(name: string, path: string, children: Array<TProjectNode> = []) {
    super(name, path);
    this.children = children;
  }

  get type(): "directory" {
    return "directory";
  }
}
