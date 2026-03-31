import mm from "micromatch";
import {
  EntityProjectNode,
  EntityProjectTree,
  LayeredProjectNode,
  LayeredProjectTree,
  TreeLintConfig,
} from "../../types/index.js";
import { DirEntity, FileEntity, FileNode, LayerNode } from "../nodes.js";

export interface EntityContext {
  layer: keyof TreeLintConfig["layers"] | null;
  depth: number;
}

export class EntitiesParser {
  protected config: TreeLintConfig;
  protected tree: LayeredProjectTree;
  protected entities: Set<string>;
  protected layers: Set<string>;
  protected initialContext: EntityContext = {
    layer: null,
    depth: 0,
  };

  constructor(config: TreeLintConfig, tree: LayeredProjectTree) {
    this.config = config;
    this.tree = tree;
    this.entities = new Set(Object.keys(config.entities || {}));
    this.layers = new Set(Object.keys(config.layers || {}));
  }

  public parse(): EntityProjectTree {
    return {
      generatedAt: this.tree.generatedAt,
      trees: this.tree.trees.map((node) =>
        this.annotateNode(node, this.initialContext),
      ),
    };
  }

  private annotateNode(
    node: LayeredProjectNode,
    currentContext: EntityContext,
  ): EntityProjectNode {
    const context =
      node instanceof LayerNode
        ? { ...currentContext, layer: node.layer }
        : currentContext;

    let currentEntity: keyof TreeLintConfig["entities"] | null = null;

    if (context.layer) {
      const allowedEntities = this.config.layers[context.layer].entities;

      for (const entity of allowedEntities) {
        const matches = this.config.entities[entity].matches;

        if (matches.namePattern && mm.isMatch(node.name, matches.namePattern)) {
          currentEntity = entity;
          break;
        }
      }
    }

    if (node instanceof FileNode) {
      return currentEntity
        ? new FileEntity(node, currentEntity, { rule: "warn" })
        : node;
    }

    const updatedChildren = node.children.map((child) =>
      this.annotateNode(child, context),
    );
    const annotatedNode = node.withNewChildren(updatedChildren);

    return currentEntity
      ? new DirEntity(annotatedNode, currentEntity, { rule: "warn" })
      : annotatedNode;
  }
}
