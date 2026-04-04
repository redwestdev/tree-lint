import mm from "micromatch";

import { ITreeLintConfig } from "@/types/config.js";
import { IEntityProjectTree, ILayeredProjectTree } from "@/types/trees.js";
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

export class EntitiesParser {
  protected config: ITreeLintConfig;
  protected tree: ILayeredProjectTree;
  protected entities: Set<string>;
  protected layers: Set<string>;
  protected initialContext: IEntityContext = {
    layer: null,
    depth: 0,
  };

  constructor(config: ITreeLintConfig, tree: ILayeredProjectTree) {
    this.config = config;
    this.tree = tree;
    this.entities = new Set(Object.keys(config.entities || {}));
    this.layers = new Set(Object.keys(config.layers || {}));
  }

  public parse(): IEntityProjectTree {
    return {
      generatedAt: this.tree.generatedAt,
      trees: this.tree.trees.map((node) =>
        this.annotateNode(node, this.initialContext),
      ),
    };
  }

  private annotateNode(
    node: TLayeredProjectNode,
    currentContext: IEntityContext,
  ): TAnyNode {
    const context =
      node instanceof LayerNode
        ? { ...currentContext, layer: node.name }
        : currentContext;

    const currentEntity: keyof ITreeLintConfig["entities"] | null = null;

    if (context.layer) {
      const allowedEntities = this.config.layers[context.layer].entities;

      for (const entity of allowedEntities) {
        const matches = this.config.entities[entity].matches;
        console.log(matches);
        // if (matches.namePattern && mm.isMatch(node.name, matches.namePattern)) {
        //   currentEntity = entity;
        //   break;
        // }
      }
    }

    if (currentEntity) {
      if (node instanceof DirNode) {
        node.children = node.children.map((child) =>
          this.annotateNode(child, context),
        );

        return new DirEntity(node, currentEntity, { rule: "warn" });
      } else if (node instanceof FileNode) {
        return new FileEntity(node, currentEntity, { rule: "warn" });
      }
    }

    return node;
  }
}
