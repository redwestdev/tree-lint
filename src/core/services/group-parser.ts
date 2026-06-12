import { DirNode, GroupNode } from "@/core/nodes/index.js";
import type { ITreeLintConfig } from "@/types/config.js";
import type { TAnyNode, TProjectNode } from "@/types/nodes.js";
import type {
  IAnnotatedProjectTree,
  IEntityProjectTree,
} from "@/types/trees.js";
import type { IValidationResult } from "@/types/validation.js";

const matchesLog: IValidationResult[] = [];

function annotateNode(
  node: TProjectNode,
  config?: ITreeLintConfig["groups"],
): TAnyNode {
  if (node instanceof DirNode && !node.isExcluded) {
    node.children = node.children.map((child: TProjectNode) =>
      annotateNode(child, config),
    );

    if (node.constructor === DirNode) {
      const matchGroup = GroupNode.match(node, config);
      matchesLog.push(...matchGroup);

      if (matchGroup.every((r) => Boolean(r.result))) {
        const rules = config?.rules;
        return new GroupNode(node, rules);
      } else return node;
    }
  }

  return node;
}

export function annotateGroups(
  tree: IEntityProjectTree,
  config: ITreeLintConfig,
): { tree: IAnnotatedProjectTree; log: IValidationResult[] } {
  const groupsConfig = config.groups;
  return {
    tree: {
      generatedAt: tree.generatedAt,
      trees: tree.trees.map((node) => annotateNode(node, groupsConfig)),
    },
    log: matchesLog,
  };
}
