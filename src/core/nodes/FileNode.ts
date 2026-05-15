import { IFileNode, INode } from "@/types/nodes.js";
import { Node } from "@/core/nodes/Node.js";

export class FileNode extends Node implements IFileNode {
  public extension: string;

  constructor({ name, path, ...analyze }: INode) {
    super(name, path);
    Object.assign(this, analyze);
    this.extension = path.split(".").pop() || "";
  }

  static async create(
    name: string,
    path: string,
    ignore: string[],
  ): Promise<FileNode> {
    const analyze = await Node.check(path, ignore);

    const data = {
      ...analyze,
      name,
      path,
    };

    return new this(data);
  }
}
