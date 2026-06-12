import { DirNode, LayerNode } from "@/core/nodes/index.js";
import type { ITreeLintConfig } from "@/types/config.js";
import type { TLayeredProjectNode, TProjectNode } from "@/types/nodes.js";
import type { ILayeredProjectTree, IProjectTree } from "@/types/trees.js";

function annotateNode(
  node: TProjectNode,
  config: ITreeLintConfig,
): TLayeredProjectNode {
  const layers: Set<string> = new Set(Object.keys(config.layers || {}));

  if (node instanceof DirNode && !node.isExcluded) {
    node.children = node.children.map((child) => annotateNode(child, config));

    const isLayer = LayerNode.match(node, layers);

    if (isLayer) {
      const rules = config.layers[node.name].rules;
      return new LayerNode(node, rules);
    } else {
      return node;
    }
  }

  return node;
}

export function annotateLayers(
  tree: IProjectTree,
  config: ITreeLintConfig,
): ILayeredProjectTree {
  return {
    generatedAt: tree.generatedAt,
    trees: tree.trees.map((node) => annotateNode(node, config)),
  };
}
