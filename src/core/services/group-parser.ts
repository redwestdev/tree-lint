import { IEntityProjectTree } from "@/types/trees.js";
import { TAnyNode, TProjectNode } from "@/types/nodes.js";
import { DirNode, GroupNode } from "@/core/nodes/index.js";
import { ITreeLintConfig } from "@/types/config.js";

function annotateNode(
  node: TProjectNode,
  config?: ITreeLintConfig["groups"],
): TAnyNode {
  if (node instanceof DirNode && !node.isExcluded) {
    node.children = node.children.map((child: TProjectNode) =>
      annotateNode(child, config),
    );

    return node.constructor === DirNode ? GroupNode.match(node, config) : node;
  }

  return node;
}

export function annotateGroups(
  tree: IEntityProjectTree,
  config: ITreeLintConfig,
) {
  const groupsConfig = config.groups;
  return {
    generatedAt: tree.generatedAt,
    trees: tree.trees.map((node) => annotateNode(node, groupsConfig)),
  };
}
