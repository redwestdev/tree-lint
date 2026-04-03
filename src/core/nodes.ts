import {
  IDirNode,
  ILayerNode,
  TFileEntity,
  TreeLintConfig,
  IFileNode,
  IDirEntity,
} from "../types/index.js";

export class Node {
  // public isValid: boolean = true;
  public errors: string[] = [];
  public warnings: string[] = [];
  public name: string;
  public path: string;
  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
  }
}

export class FileNode extends Node implements IFileNode {
  public extension: string;
  constructor(name: string, path: string) {
    super(name, path);
    this.extension = path.split(".").pop() || "";
  }
}

export class DirNode extends Node implements IDirNode {
  constructor(
    name: string,
    path: string,
    public children: Array<IDirNode | IFileNode>,
  ) {
    super(name, path);
  }
  // public withNewChildren(children: AnyProjectNode[]): DirNode {
  //   return new DirNode(this.name, this.path, children);
  // }
}

export class LayerNode extends DirNode implements ILayerNode {
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

  // public override withNewChildren(children: AnyProjectNode[]): TFileEntity {
  //   const dir: DirNode = super.withNewChildren(children);
  //   return new LayerNode(dir, this.layer, this.rules);
  // }
}

export class DirEntity extends DirNode implements IDirEntity {
  public isValid: boolean = true;
  public errors: string[] = [];
  public warnings: string[] = [];

  constructor(
    node: DirNode,
    public readonly entity: keyof TreeLintConfig["entities"],
    private readonly rules: Record<string, string>,
  ) {
    super(node.name, node.path, node.children);
  }

  validate() {
    console.log("Validation rules:", this.rules);
  }
}

export class FileEntity extends FileNode implements TFileEntity {
  public isValid: boolean = true;
  public errors: string[] = [];
  public warnings: string[] = [];

  constructor(
    node: FileNode,
    public readonly entity: keyof TreeLintConfig["entities"],
    private readonly rules: Record<string, string>,
  ) {
    super(node.name, node.path);
  }

  validate() {
    console.log("Validation rules:", this.rules);
  }
}
