import { NodeType, TAnyNode, TNodeType } from "@/types/nodes.js";
import { DirNode } from "@/core/nodes/index.js";

export const getNodeType = (node: TAnyNode): TNodeType =>
  node instanceof DirNode ? NodeType.DirNode : NodeType.FileNode;
