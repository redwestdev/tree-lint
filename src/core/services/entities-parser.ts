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
import {
  IDirEntityRule,
  IFileEntityRule,
  IValidationResult,
} from "@/types/validation.js";

export interface IEntityContext {
  layer: keyof ITreeLintConfig["layers"] | null;
  depth: number;
}

const initialContext: IEntityContext = {
  layer: null,
  depth: 0,
};

const matchesLog: IValidationResult[] = [];

function annotateNode(
  node: TLayeredProjectNode,
  currentContext: IEntityContext,
  config: ITreeLintConfig,
): TAnyNode {
  const { entities, layers } = config;
  const context =
    node instanceof LayerNode
      ? { ...currentContext, layer: node.name }
      : currentContext;

  if (node instanceof DirNode && !node.isExcluded) {
    node.children = node.children.map((child) =>
      annotateNode(child, context, config),
    );
  }

  if (context.layer && !(node instanceof LayerNode)) {
    const allowedEntities = layers[context.layer].entities;

    for (const entity of allowedEntities) {
      const entityConfig = entities[entity];
      const { matches, rules } = entityConfig;

      if (
        matches.type === "directory" &&
        node instanceof DirNode &&
        !node.isExcluded
      ) {
        const matchResult: IValidationResult[] = DirEntity.match(
          node,
          matches,
          entity,
        );
        matchesLog.push(...matchResult);

        if (matchResult.every((r) => Boolean(r.result)))
          return DirEntity.createNew(node, entity, rules as IDirEntityRule);
      }

      if (
        matches.type === "file" &&
        node instanceof FileNode &&
        !node.isExcluded
      ) {
        const matchResult: IValidationResult[] = FileEntity.match(
          node,
          matches,
          entity,
        );
        matchesLog.push(...matchResult);

        if (matchResult.every((r) => Boolean(r.result)))
          return FileEntity.createNew(node, entity, rules as IFileEntityRule);
      }
    }
  }

  return node;
}

export function annotateEntities(
  tree: ILayeredProjectTree,
  config: ITreeLintConfig,
): { tree: ILayeredProjectTree; log: IValidationResult[] } {
  return {
    tree: {
      generatedAt: tree.generatedAt,
      trees: tree.trees.map((node) =>
        annotateNode(node, initialContext, config),
      ),
    },
    log: matchesLog,
  };
}
