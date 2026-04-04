import { Node } from "@/core/nodes/Node.js";
import { IDirNode, IFileNode } from "@/types/nodes.js";

export class DirNode extends Node implements IDirNode {
  public children: Array<IDirNode | IFileNode>;

  constructor(
    name: string,
    path: string,
    children: Array<IDirNode | IFileNode> = [],
  ) {
    super(name, path);
    this.children = children;
  }
}
