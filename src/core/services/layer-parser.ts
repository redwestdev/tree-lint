import { ITreeLintConfig } from "@/types/config.js";
import { ILayeredProjectTree, IProjectTree } from "@/types/trees.js";
import { TLayeredProjectNode, TProjectNode } from "@/types/nodes.js";
import { DirNode, LayerNode } from "@/core/nodes/index.js";

export class LayerParser {
  protected layerNames: Set<string> = new Set(
    Object.keys(this.config.layers || {}),
  );

  constructor(
    protected config: ITreeLintConfig,
    protected tree: IProjectTree,
  ) {}

  public parse(): ILayeredProjectTree {
    return {
      generatedAt: this.tree.generatedAt,
      trees: this.tree.trees.map((node) => this.annotateNode(node)),
    };
  }

  private annotateNode(node: TProjectNode): TLayeredProjectNode {
    if (node instanceof DirNode) {
      const isLayerDirectory = this.layerNames.has(node.name);

      const updatedChildren = node.children.map((child: TProjectNode) =>
        this.annotateNode(child),
      );

      node.children = updatedChildren;

      if (isLayerDirectory) {
        return new LayerNode(node, {
          rule: "warn",
        });
      }

      return new DirNode(node.name, node.path, updatedChildren);
    }

    return node;
  }
}
