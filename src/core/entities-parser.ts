import { TreeLintConfig } from "../cli.js";
import {
  LayeredProjectTreeResult,
  LayeredProjectNode,
} from "./layer-parser.js";

import mm from "micromatch";

export interface EntityProjectNode extends LayeredProjectNode {
  entity: string | null;
}

export interface EntityProjectTreeResult {
  generatedAt: string;
  trees: EntityProjectNode[];
}

export interface EntityContext {
  layer: string | null;
  depth: number;
}

export class EntitiesParser {
  protected config: TreeLintConfig;
  protected tree: LayeredProjectTreeResult;
  protected entities: Set<string>;
  protected layers: Set<string>;
  protected initialContext: EntityContext = {
    layer: null,
    depth: 0,
  };

  constructor(config: TreeLintConfig, tree: LayeredProjectTreeResult) {
    this.config = config;
    this.tree = tree;
    this.entities = new Set(Object.keys(config.entities || {}));
    this.layers = new Set(Object.keys(config.layers || {}));
  }

  public parse(): EntityProjectTreeResult {
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
      node.type === "directory" && node.layer
        ? { ...currentContext, layer: node.layer }
        : currentContext;

    let currentEntity: string | null = null;

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

    return {
      ...node,
      entity: currentEntity,
      children: node.children?.map((child) =>
        this.annotateNode(child, context),
      ),
    };
  }
}
