import { IValidationResult } from "@/types/validation.js";
import { TAnyNode } from "@/types/nodes.js";
import { IAnnotatedProjectTree } from "@/types/trees.js";

function updateNodeValidity(node: TAnyNode, paths: Set<string>) {
  if (paths.has(node.path)) {
    node.isValid = false;
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) updateNodeValidity(child, paths);
  }
}

export function validateTree(tree: IAnnotatedProjectTree): IValidationResult[] {
  const log: IValidationResult[] = tree.trees.reduce<IValidationResult[]>(
    (log, node: TAnyNode) => {
      const res = node.validate?.() ?? [];

      for (const entry of res) {
        for (const item of Object.values(entry)) {
          if (item) log.push(item);
        }
      }

      return log;
    },
    [],
  );

  const invalidPaths = new Set(
    log
      .map((item) => {
        if (!item.result && item.violation?.type === "error")
          return item.violation?.path;
      })
      .filter((v) => v !== undefined),
  );

  for (const node of tree.trees) updateNodeValidity(node, invalidPaths);

  return log;
}
