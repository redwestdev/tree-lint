import {
  DirEntity,
  DirNode,
  FileEntity,
  FileNode,
  LayerNode,
} from "@/core/nodes/index.js";
import {
  matchChildren,
  matchName,
  matchType,
} from "@/core/services/matcher/utils.js";
import type {
  IDirEntityConf,
  IEntity,
  ITreeLintConfig,
} from "@/types/config.js";
import type { TAnyNode } from "@/types/nodes.js";
import type { IEntityProjectTree, ILayeredProjectTree } from "@/types/trees.js";
import type {
  IDirEntityRule,
  IFileEntityRule,
  IValidationResult,
} from "@/types/validation.js";

export interface IEntityContext {
  layer: keyof ITreeLintConfig["layers"] | null;
  entity: keyof ITreeLintConfig["entities"] | null;
  depth: number;
}

const initialContext: IEntityContext = {
  layer: null,
  entity: null,
  depth: 0,
};

const matchesLog: IValidationResult[] = [];

function allowNestedEntities(config: IEntity): config is IDirEntityConf {
  return config && "entities" in config;
}

function annotateNode(
  node: TAnyNode,
  currentContext: IEntityContext,
  config: ITreeLintConfig,
): TAnyNode {
  const { entities, layers } = config;
  const context =
    node instanceof LayerNode
      ? { ...currentContext, layer: node.name }
      : currentContext;

  if (node instanceof DirNode && !node.isExcluded) {
    context.depth++;

    node.children = node.children.map((child) =>
      annotateNode(child, context, config),
    );
  }

  if ((context.layer || context.entity) && !(node instanceof LayerNode)) {
    let allowedEntities: Array<string>;

    if (context.entity) {
      const currentConfig = entities[context.entity];
      const allow = currentConfig && allowNestedEntities(currentConfig);
      allowedEntities =
        allow && currentConfig.entities ? currentConfig.entities : [];
    } else {
      allowedEntities = context.layer ? layers[context.layer].entities : [];
    }

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

        if (matchResult.every((r) => Boolean(r.result))) {
          const dirRules = rules as IDirEntityRule | undefined;
          const dirEntity = new DirEntity(node, entity, dirRules);

          if (allowNestedEntities(entityConfig)) {
            context.entity = entity;

            dirEntity.children = dirEntity.children.map((child) =>
              annotateNode(child, context, config),
            );
          }

          if (dirEntity.children.length > 0 && dirRules?.children?.length) {
            for (const child of dirEntity.children) {
              for (const rule of dirRules.children) {
                if (!rule._matches) continue;

                const childMatches: Record<string, boolean> = {
                  type: matchType(child, rule._matches.type),
                  name: matchName(child.name, rule._matches.name || ""),
                };

                if (
                  child instanceof DirNode &&
                  child.children.length &&
                  "children" in rule._matches
                )
                  childMatches.children = matchChildren(
                    child.children,
                    rule._matches.children,
                  );

                if (Object.values(childMatches).every(Boolean)) {
                  child.rules = rule;
                }
              }
            }
          }

          return dirEntity;
        }
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
          return new FileEntity(node, entity, rules as IFileEntityRule);
      }
    }
  }

  return node;
}

export function annotateEntities(
  tree: ILayeredProjectTree,
  config: ITreeLintConfig,
): { tree: IEntityProjectTree; log: IValidationResult[] } {
  matchesLog.length = 0;

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
