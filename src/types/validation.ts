import { DirEntity, FileEntity } from "@/core/nodes/index.js";
import { TMatches, TNaming } from "@/types/config.js";

export type TSeverity = "error" | "warning" | (string & {});

export type TNodeRulesNames = "nameLength" | "name" | "weight" | "isEmpty";

export type TFilesRulesNames = "extension" | "lineCount";

export type TDirRulesNames =
  | "childrenAmount"
  | "includes"
  | "excludes"
  | "children";

export interface IBaseRule {
  type: TSeverity;
  message?: string;
}

export interface IViolation {
  type: string;
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

export interface IWeightRule extends IBaseRule {
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

export interface INodeRule {
  nameLength?: INameLengthRule;
  name?: INameRule;
  weight?: IWeightRule;
  isEmpty?: IBaseRule;
}

export interface IFileRule extends INodeRule {
  lineCount?: ILineCountRule;
}
export interface IDirRule extends INodeRule {
  childrenAmount?: IChildrenAmountRule;
  includes?: Array<TMatches>;
  excludes?: Array<TMatches>;
  children?: Array<TAnyRule>;
}

export type TEntityRule = IFileEntityRule | IDirEntityRule;

export interface IDirEntityRule extends IDirRule {
  custom?: (
    node: DirEntity,
    results: Record<keyof IDirEntityRule, IValidationResult>,
  ) => IValidationResult;
}
export interface IFileEntityRule extends IFileRule {
  custom?: (
    node: FileEntity,
    results: Record<keyof IFileEntityRule, IValidationResult>,
  ) => IValidationResult;
}

export type TAnyRule = TEntityRule | INodeRule | IFileRule | IDirRule;
