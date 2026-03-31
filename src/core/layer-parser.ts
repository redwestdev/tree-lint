import { TreeLintConfig } from "../cli.js";
import {
  DirNode,
  FileNode,
  ProjectNode,
  ProjectTree,
} from "./file-system-scanner.js";
import { AnyProjectNode } from "./entities-parser.js";

export interface Validator {
  validate(): void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class LayerNode extends DirNode implements Validator {
  public isValid: boolean = true;
  public errors: string[] = [];
  public warnings: string[] = [];

  constructor(
    node: DirNode,
    public readonly layer: keyof TreeLintConfig["layers"],
    private readonly rules: Record<string, string>,
  ) {
    super(node.name, node.path, node.children);
  }

  validate() {
    console.log("Validation rules:", this.rules);
  }

  public override withNewChildren(children: AnyProjectNode[]): LayerNode {
    const dir: DirNode = super.withNewChildren(children);
    return new LayerNode(dir, this.layer, this.rules);
  }
}

export type LayeredProjectNode = ProjectNode | LayerNode;

export interface LayeredProjectTree {
  generatedAt: string;
  trees: LayeredProjectNode[];
}

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
