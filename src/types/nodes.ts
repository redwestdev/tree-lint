import { ITreeLintConfig } from "@/types/config.js";
import {
  IDirEntityRule,
  IDirRule,
  IDirRuleBase,
  IFileEntityRule,
  IFileRule,
  IFileRuleBase,
  IGroupRule,
  ILayerRule,
  INodeRule,
  IValidationResult,
} from "@/types/validation.js";
import {
  DirEntity,
  DirNode,
  FileEntity,
  FileNode,
  GroupNode,
  LayerNode,
} from "@/core/nodes/index.js";

export interface INode<TRule extends object = INodeRule> {
  name: string;
  path: string;
  size: number;
  ignored?: boolean;
  unreadable?: boolean;
  hidden?: boolean;
  isValid?: boolean;
  isExcluded?: boolean;
  rules?: TRule;
  validate?: (rules?: TRule) => Partial<Record<string, IValidationResult>>[];
}

export interface IFileNode<
  TRule extends IFileRuleBase = IFileRule,
> extends INode<TRule> {
  extension: string;
  lines: number;
}

export interface IDirNode<
  TRule extends IDirRuleBase = IDirRule,
> extends INode<TRule> {
  children: TAnyNode[];
}

export interface ILayerNode extends IDirNode<ILayerRule> {}

export interface IFileEntity extends IFileNode<IFileEntityRule> {
  entity: keyof ITreeLintConfig["entities"];
}

export interface IDirEntity extends IDirNode<IDirEntityRule> {
  entity: keyof ITreeLintConfig["entities"];
}

export interface IGroupNode extends IDirNode<IGroupRule> {}

export enum NodeType {
  DirNode = "directory",
  FileNode = "file",
}

export type TNodeType = "file" | "directory";

export type TProjectNode = DirNode<IDirRuleBase> | FileNode<IFileRuleBase>;

export type TLayeredProjectNode = TProjectNode | LayerNode;

export type TAnyNode =
  | DirNode<IDirRuleBase>
  | FileNode<IFileRuleBase>
  | LayerNode
  | FileEntity
  | DirEntity
  | GroupNode;
