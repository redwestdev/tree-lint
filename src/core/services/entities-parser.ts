import mm from "micromatch";

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

  const currentEntity: keyof ITreeLintConfig["entities"] | null = null;

  if (context.layer) {
    const allowedEntities = layers[context.layer].entities;

    for (const entity of allowedEntities) {
      const matches = entities[entity].matches;
      console.log(matches);
      // if (matches.namePattern && mm.isMatch(node.name, matches.namePattern)) {
      //   if (node instanceof LayerNode) {
      //     node.isValid = false;
      //     node.errors.push("Node is defined as both a Layer and an Entity.");
      //   }
      //   currentEntity = entity;
      //   break;
      // }
    }
  }

  if (node instanceof DirNode) {
    node.children = node.children.map((child: TAnyNode) =>
      annotateNode(child, context, entities, layers),
    );

    return currentEntity
      ? new DirEntity(node, currentEntity, { rule: "warn" })
      : node;
  } else if (node instanceof FileNode) {
    return currentEntity
      ? new FileEntity(node, currentEntity, { rule: "warn" })
      : node;
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
