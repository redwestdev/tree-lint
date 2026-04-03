export interface INode {
  name: string;
  path: string;

  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IFileNode extends INode {
  extension: string;
}

export interface IDirNode extends INode {
  children: IAnyNode[];
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

export type IAnyNode =
  | IDirNode
  | IFileNode
  | ILayerNode
  | TFileEntity
  | IDirEntity
  | IGroupNode;
