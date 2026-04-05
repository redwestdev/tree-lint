export interface INode {
  name: string;
  path: string;
  readonly type: TNodeType;

  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IFileNode extends INode {
  extension: string;
}

export interface IDirNode extends INode {
  children: TAnyNode[];
}

export interface ILayerNode extends IDirNode {
  validate(): void;
}

export interface TFileEntity extends IFileNode {
  validate(): void;
}

export interface IDirEntity extends IDirNode {
  validate(): void;
}

export interface IGroupNode extends IDirNode {
  validate(): void;
}

export type TNodeType = "file" | "directory";

export type TProjectNode = IDirNode | IFileNode;

export type TLayeredProjectNode = TProjectNode | ILayerNode;

export type TAnyNode =
  | IDirNode
  | IFileNode
  | ILayerNode
  | TFileEntity
  | IDirEntity
  | IGroupNode;
