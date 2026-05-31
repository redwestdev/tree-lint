import { TMatches, TNaming } from "@/types/config.js";
import {
  DirEntity,
  DirNode,
  FileEntity,
  FileNode,
  GroupNode,
  LayerNode,
  Node,
} from "@/core/nodes/index.js";

export type TSeverity = "error" | "warning" | (string & {});

export interface IBaseRule {
  type: TSeverity;
  message?: string;
}

export interface IViolation {
  type: TSeverity;
  path: string;
  message: string;
}

export interface IValidationResult {
  result: boolean;
  violation?: IViolation;
}

export interface INameLengthRule extends IBaseRule {
  min?: number;
  max: number;
}

export interface INameRule extends IBaseRule {
  pattern: TNaming | (string & {});
}

export interface ISizeRule extends IBaseRule {
  min?: number;
  max: number;
}

export interface ILineCountRule extends IBaseRule {
  min?: number;
  max: number;
}

export interface IChildrenAmountRule extends IBaseRule {
  min?: number;
  max: number;
}

export interface ICustomRule extends IBaseRule {
  callback: (
    node: Node,
    results?: Partial<Record<string, IValidationResult>>[],
  ) => boolean;
}

export interface ICustomFileEntityRule extends IBaseRule {
  callback: (
    node: FileEntity,
    results?: Partial<Record<string, IValidationResult>>[],
  ) => boolean;
}
export interface ICustomFileRule extends IBaseRule {
  callback: (
    node: FileNode,
    results?: Partial<Record<string, IValidationResult>>[],
  ) => boolean;
}
export interface ICustomDirRule extends IBaseRule {
  callback: (
    node: DirNode,
    results?: Partial<Record<string, IValidationResult>>[],
  ) => boolean;
}
export interface ICustomDirEntityRule extends IBaseRule {
  callback: (
    node: DirEntity,
    results?: Partial<Record<string, IValidationResult>>[],
  ) => boolean;
}
export interface ICustomLayerRule extends IBaseRule {
  callback: (
    node: LayerNode,
    results?: Partial<Record<string, IValidationResult>>[],
  ) => boolean;
}
export interface ICustomGroupRule extends IBaseRule {
  callback: (
    node: GroupNode,
    results?: Partial<Record<string, IValidationResult>>[],
  ) => boolean;
}

export interface INodeRule {
  _matches?: TMatches;
  nameLength?: INameLengthRule;
  name?: INameRule;
  size?: ISizeRule;
  isEmpty?: IBaseRule;
}

export interface IFileRuleBase extends INodeRule {
  lineCount?: ILineCountRule;
}

export interface IDirRuleBase extends INodeRule {
  childrenAmount?: IChildrenAmountRule;
  includes?: Array<TMatches>;
  excludes?: Array<TMatches>;
  children?: Array<TAnyRule>;
}

export interface IFileRule extends IFileRuleBase {
  custom?: ICustomFileRule;
}

export interface IDirRule extends IDirRuleBase {
  custom?: ICustomDirRule;
}

export interface IDirEntityRule extends IDirRuleBase {
  custom?: ICustomDirEntityRule;
}
export interface IFileEntityRule extends IFileRuleBase {
  custom?: ICustomFileEntityRule;
}

export type TEntityRule = IFileEntityRule | IDirEntityRule;

export interface ILayerRule extends IDirRuleBase {
  custom?: ICustomLayerRule;
}
export interface IGroupRule extends IDirRuleBase {
  custom?: ICustomGroupRule;
}

export type TAnyRule =
  | INodeRule
  | IFileRule
  | IDirRule
  | IFileEntityRule
  | IDirEntityRule
  | ILayerRule
  | IGroupRule;

export type TGroupedByPath = Record<
  string,
  { error: string[]; warning: string[] }
>;

export type TGroupedBySeverity = {
  error: { message: string; path: string }[];
  warning: { message: string; path: string }[];
};

export type TGroupedByRule = Record<
  string,
  { error: Set<string>; warning: Set<string> }
>;

export interface IValidationStatsPath {
  type: "path";
  errors: number;
  warnings: number;
  grouped: TGroupedByPath;
}
export interface IValidationStatsSeverity {
  type: "severity";
  errors: number;
  warnings: number;
  grouped: TGroupedBySeverity;
}
export interface IValidationStatsRule {
  type: "rule";
  errors: number;
  warnings: number;
  grouped: TGroupedByRule;
}
export type TValidationStats =
  | IValidationStatsPath
  | IValidationStatsSeverity
  | IValidationStatsRule;

export type TGroupOptions = "path" | "severity" | "rule";
