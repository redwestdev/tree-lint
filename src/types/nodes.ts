import { ITreeLintConfig } from "@/types/config.js";
import { IDirRule, INodeRule, IValidationResult } from "@/types/validation.js";

type TValidationMap<R> = Partial<Record<keyof R, IValidationResult>>;

export interface INode<R extends object = INodeRule> {
  name: string;
  path: string;
  isValid?: boolean;
  errors?: string[];
  warnings?: string[];
  ignored?: boolean;
  unreadable?: boolean;
  hidden?: boolean;
  validate?: (rules?: R) => TValidationMap<R>[];
}

export interface IFileNode extends INode {
  extension: string;
}

export interface IDirNode extends INode<IDirRule> {
  children: TAnyNode[];
}

export interface ILayerNode extends IDirNode {}

export interface IFileEntity extends IFileNode {
  entity: keyof ITreeLintConfig["entities"];
}

export interface IDirEntity extends IDirNode {
  entity: keyof ITreeLintConfig["entities"];
}

export interface IGroupNode extends IDirNode {}

export enum NodeType {
  DirNode = "directory",
  FileNode = "file",
}

export type TNodeType = "file" | "directory";

export type TProjectNode = IDirNode | IFileNode;

export type TLayeredProjectNode = TProjectNode | ILayerNode;

export type TAnyNode =
  | IDirNode
  | IFileNode
  | ILayerNode
  | IFileEntity
  | IDirEntity
  | IGroupNode;
