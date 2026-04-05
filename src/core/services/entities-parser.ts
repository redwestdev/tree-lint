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
import { matchNode } from "@/core/services/matcher/node-matchers.js";

export interface IEntityContext {
  layer: keyof ITreeLintConfig["layers"] | null;
  depth: number;
}

const initialContext: IEntityContext = {
  layer: null,
  depth: 0,
};

export const MATCHING_ERRORS: Record<string, string> = {
  type: "Node type mismatch.",
  name: "Name does not match the required pattern or convention.",
  extensions: "Invalid file extension.",
  childrenLength:
    "This directory is empty, but a valid entity must contain files.",
  children: "Invalid composition of child elements.",
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

  let currentEntity: keyof ITreeLintConfig["entities"] | null = null;

  if (context.layer && !(node instanceof LayerNode)) {
    const allowedEntities = layers[context.layer].entities;

    for (const entity of allowedEntities) {
      const matches = entities[entity].matches;
      if (node.type !== matches.type) continue;
      const result = matchNode(node, matches);
      const isEntity = Object.values(result).some(Boolean);

      if (isEntity) {
        currentEntity = entity;
        node.isValid = Object.values(result).every(Boolean);

        if (!node.isValid) {
          for (const key in result) {
            if (!result[key]) node.errors.push(MATCHING_ERRORS[key]);
          }
        }

        break;
      }
    }
  }

  if (node instanceof DirNode) {
    node.children = node.children.map((child: TAnyNode) =>
      annotateNode(child, context, entities, layers),
    );

    return currentEntity
      ? new DirEntity(node, currentEntity, {
          rule: "Validate this as 'dir entity'",
        })
      : node;
  } else if (node instanceof FileNode) {
    return currentEntity
      ? new FileEntity(node, currentEntity, {
          rule: "Validate this as 'file entity'",
        })
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
