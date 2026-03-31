import { AnyProjectNode, TreeLintConfig, Validator } from "../types/index.js";

export class Node {
  constructor(
    public name: string,
    public path: string,
  ) {}
}

export class FileNode extends Node {
  public readonly type: string = "file";

  constructor(name: string, path: string) {
    super(name, path);
  }
}

export class DirNode extends Node {
  public readonly type: string = "directory";

  constructor(
    name: string,
    path: string,
    public children: AnyProjectNode[] = [],
  ) {
    super(name, path);
  }

  public withNewChildren(children: AnyProjectNode[]): DirNode {
    return new DirNode(this.name, this.path, children);
  }
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

export class DirEntity extends DirNode implements Validator {
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

export class FileEntity extends FileNode implements Validator {
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
