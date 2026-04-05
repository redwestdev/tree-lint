import { IFileNode } from "@/types/nodes.js";
import { Node } from "@/core/nodes/Node.js";

export class FileNode extends Node implements IFileNode {
  public extension: string;

  constructor(name: string, path: string) {
    super(name, path);
    this.extension = path.split(".").pop() || "";
  }

  get type(): "file" {
    return "file";
  }
}
