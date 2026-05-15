import { TAnyNode } from "@/types/nodes.js";
import { validationLogger } from "@/utils/index.js";
import { DirNode } from "@/core/nodes/index.js";

export type TValidationStats = {
  errors: number;
  warnings: number;
};

export const validateNodes = (
  node: TAnyNode,
  stats: TValidationStats,
  // acc
): void => {
  node.validate?.();

  if (node.warnings?.length) {
    stats.warnings += node.warnings.length;
  }

  if (node.errors?.length) {
    stats.errors += node.errors.length;
  }

  if (node instanceof DirNode) {
    node.children.forEach((child: TAnyNode) => {
      validateNodes(child, stats);
    });
  }
};
