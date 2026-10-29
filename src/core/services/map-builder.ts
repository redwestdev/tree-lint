import { PROJECT_MAP } from "@/commands/scan.js";
import type { TAnyNode } from "@/types/nodes.js";

export function buildTreeMap(node: TAnyNode) {
  PROJECT_MAP.set(node.path, node);

  if ("children" in node) {
    for (const child of node.children) buildTreeMap(child);
  }
}
