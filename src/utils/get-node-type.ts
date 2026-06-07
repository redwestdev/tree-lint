import { DirNode } from "@/core/nodes/index.js";
import { NodeType, type TAnyNode, type TNodeType } from "@/types/nodes.js";

export const getNodeType = (node: TAnyNode): TNodeType =>
  node instanceof DirNode ? NodeType.DirNode : NodeType.FileNode;
