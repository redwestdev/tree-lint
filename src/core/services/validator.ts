import { TAnyNode } from "@/types/nodes.js";
import { validationLogger } from "@/utils/index.js";
import { DirNode } from "@/core/nodes/index.js";

export const validateNodes = (node: TAnyNode) => {
  if (node.warnings?.length) validationLogger(node.path, node.warnings);

  if ("validate" in node) node.validate();
  if (node instanceof DirNode) {
    node.children.forEach((child: TAnyNode) => validateNodes(child));
  }
};
