import { TreeLintConfig } from "../cli.js";
import { ProjectNode, ProjectTreeResult } from "./file-system-scanner.js";

export interface LayeredProjectNode extends ProjectNode {
  layer?: string;
  children?: LayeredProjectNode[];
}

export interface LayeredProjectTreeResult {
  generatedAt: string;
  trees: LayeredProjectNode[];
}

export class LayerParser {
  protected config: TreeLintConfig;
  protected tree: ProjectTreeResult;
  protected layerNames: Set<string>;

  constructor(config: TreeLintConfig, tree: ProjectTreeResult) {
    this.config = config;
    this.tree = tree;
    this.layerNames = new Set(Object.keys(config.layers || {}));
  }

  public parse(): LayeredProjectTreeResult {
    return {
      generatedAt: this.tree.generatedAt,
      trees: this.tree.trees.map((node) => this.annotateNode(node)),
    };
  }

  private annotateNode(node: ProjectNode): LayeredProjectNode {
    const isLayerDirectory =
      node.type === "directory" && this.layerNames.has(node.name);

    return {
      ...node,
      ...(isLayerDirectory ? { layer: node.name } : {}),
      children: node.children?.map((child) => this.annotateNode(child)),
    };
  }
}
