import { ITreeLintConfig } from "@/types/config.js";
import { ILayeredProjectTree, IProjectTree } from "@/types/trees.js";
import { TLayeredProjectNode, TProjectNode } from "@/types/nodes.js";
import { DirNode, LayerNode } from "@/core/nodes/index.js";

function annotateNode(
  node: TProjectNode,
  layers: Set<string>,
): TLayeredProjectNode {
  if (node instanceof DirNode && !node.isExcluded) {
    node.children = node.children.map((child: TProjectNode) =>
      annotateNode(child, layers),
    );

    return LayerNode.match(node, layers);
  }

  return node;
}

export function annotateLayers(
  tree: IProjectTree,
  config: ITreeLintConfig,
): ILayeredProjectTree {
  const layers: Set<string> = new Set(Object.keys(config.layers || {}));

  return {
    generatedAt: tree.generatedAt,
    trees: tree.trees.map((node) => annotateNode(node, layers)),
  };
}
