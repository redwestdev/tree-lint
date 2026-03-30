import { TreeLintConfig } from "../cli.js";
import {
  DirNode,
  FileNode,
  ProjectNode,
  ProjectTree,
} from "./file-system-scanner.js";

export interface Validator {
  validate(): void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class LayerNode extends DirNode implements Validator {
  public layer: keyof TreeLintConfig["layers"];
  public isValid: boolean;
  public errors: string[];
  public warnings: string[];

  private readonly rules: Record<string, string>;

  constructor(
    node: DirNode,
    layer: keyof TreeLintConfig["layers"],
    rules: Record<string, string>,
  ) {
    super(node.name, node.path, node.children);
    this.layer = layer;
    this.rules = rules;
    this.errors = [];
    this.warnings = [];
    this.isValid = true;
  }

  validate() {
    console.log("Validation rules:", this.rules);
  }
}

export type LayeredProjectNode = ProjectNode | LayerNode;

export interface LayeredProjectTree {
  generatedAt: string;
  trees: LayeredProjectNode[];
}

export class LayerParser {
  protected config: TreeLintConfig;
  protected tree: ProjectTree;
  protected layerNames: Set<string>;

  constructor(config: TreeLintConfig, tree: ProjectTree) {
    this.config = config;
    this.tree = tree;
    this.layerNames = new Set(Object.keys(config.layers || {}));
  }

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

    if (isLayerDirectory) {
      return new LayerNode({ ...node, children: updatedChildren }, node.name, {
        rule: "warn",
      });
    }

    return new DirNode(node.name, node.path, updatedChildren);
  }
}
