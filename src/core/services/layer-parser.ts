import { DirNode, FileNode, LayerNode } from "../nodes.js";
import {
  LayeredProjectNode,
  LayeredProjectTree,
  ProjectNode,
  ProjectTree,
  TreeLintConfig,
} from "../../types/index.js";

export class LayerParser {
  protected layerNames: Set<string> = new Set(
    Object.keys(this.config.layers || {}),
  );

  constructor(
    protected config: TreeLintConfig,
    protected tree: ProjectTree,
  ) {}

  public parse(): LayeredProjectTree {
    return {
      generatedAt: this.tree.generatedAt,
      trees: this.tree.trees.map((node) => this.annotateNode(node)),
    };
  }

  private annotateNode(node: ProjectNode): LayeredProjectNode {
    if (node instanceof FileNode) return node;

    const isLayerDirectory = this.layerNames.has(node.name);
    const updatedChildren = node.children?.map((child) =>
      this.annotateNode(child),
    );

    const annotatedNode = node.withNewChildren(updatedChildren);

    if (isLayerDirectory) {
      return new LayerNode(annotatedNode, node.name, {
        rule: "warn",
      });
    }

    return new DirNode(node.name, node.path, updatedChildren);
  }
}
