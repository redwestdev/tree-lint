import { ITreeLintConfig } from "@/types/config.js";
import { ILayeredProjectTree } from "@/types/trees.js";
import { TAnyNode, TLayeredProjectNode } from "@/types/nodes.js";
import {
  DirEntity,
  DirNode,
  FileEntity,
  FileNode,
  LayerNode,
} from "@/core/nodes/index.js";

export interface IEntityContext {
  layer: keyof ITreeLintConfig["layers"] | null;
  depth: number;
}

const initialContext: IEntityContext = {
  layer: null,
  depth: 0,
};

function annotateNode(
  node: TLayeredProjectNode,
  currentContext: IEntityContext,
  entities: ITreeLintConfig["entities"],
  layers: ITreeLintConfig["layers"],
): TAnyNode {
  const context =
    node instanceof LayerNode
      ? { ...currentContext, layer: node.name }
      : currentContext;

  if (node instanceof DirNode && !node.isExcluded) {
    node.children = node.children.map((child) =>
      annotateNode(child, context, entities, layers),
    );
  }

  if (context.layer && !(node instanceof LayerNode)) {
    const allowedEntities = layers[context.layer].entities;

    for (const entity of allowedEntities) {
      const matches = entities[entity].matches;

      if (
        matches.type === "directory" &&
        node instanceof DirNode &&
        !node.isExcluded
      ) {
        return DirEntity.match(entity, node, matches);
      }

      if (
        matches.type === "file" &&
        node instanceof FileNode &&
        !node.isExcluded
      ) {
        return FileEntity.match(entity, node, matches);
      }
    }
  }

  return node;
}

export function annotateEntities(
  tree: ILayeredProjectTree,
  config: ITreeLintConfig,
): ILayeredProjectTree {
  return {
    generatedAt: tree.generatedAt,
    trees: tree.trees.map((node) =>
      annotateNode(node, initialContext, config.entities, config.layers),
    ),
  };
}
