import { IFileNode, INode } from "@/types/nodes.js";
import { INodeAnalyze, Node } from "@/core/nodes/Node.js";
import { IFileRule, INodeRule, IValidationResult } from "@/types/validation.js";

export class FileNode extends Node implements IFileNode {
  public extension: string;

  constructor(
    { name, path }: INode,
    analyze?: INodeAnalyze,
    rules?: IFileRule,
  ) {
    super(name, path);
    Object.assign(this, analyze);
    this.extension = path.split(".").pop() || "";
    this.rules = rules;
  }

  static async create(
    name: string,
    path: string,
    ignore: string[],
  ): Promise<FileNode> {
    const analyze = await Node.check(path, ignore);

    const node = new Node(name, path);

    return new this(node, analyze);
  }

  validate(
    rules: INodeRule | undefined = this.rules,
  ): Partial<Record<keyof INodeRule, IValidationResult>>[] {
    return super.validate(rules);
  }
}
