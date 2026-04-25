import { Node } from "@/core/nodes/Node.js";
import { IDirNode, INode, TProjectNode } from "@/types/nodes.js";
import { validationLogger } from "@/utils/index.js";

export class DirNode extends Node implements IDirNode {
  public children: Array<TProjectNode>;

  constructor(
    { name, path, ...analyze }: INode,
    children: Array<TProjectNode> = [],
  ) {
    super(name, path);
    this.children = children;
    Object.assign(this, analyze);
  }

  static async create(
    name: string,
    path: string,
    ignore: string[],
    children: Array<TProjectNode>,
  ): Promise<DirNode> {
    const analyze = await Node.check(path, ignore);

    const data = {
      ...analyze,
      name,
      path,
    };

    return new this(data, children);
  }

  validate() {
    super.validate();
    if (!this.isValid) {
      validationLogger(this.path, this.warnings, this.errors);
    }
  }
}
