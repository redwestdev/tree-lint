import { IDirEntity, IFileEntity, TAnyNode } from "./nodes.js";

export type TCustomMatch = (node: TAnyNode) => boolean;

export type TNaming =
  | "camelCase"
  | "PascalCase"
  | "kebab-case"
  | "snake_case"
  | "other";

export interface ITreeLintConfig<
  L extends string = string,
  E extends string = string,
> {
  roots?: string[];
  ignore?: string[];
  layers: Record<L, ILayer<E>>;
  entities: Record<E, IEntity>;
  groups?: IGroup;
}

export interface IFileEntity {
  matches: IMatchFile;
  rules?: IFileEntityRule;
}
export interface IDirEntity {
  matches: IMatchDirectory;
  rules?: IDirEntityRule;
}

export type IEntity = IDirEntity | IFileEntity;

export interface IGroup {
  name: string;
  children?: Array<TMatches>;
  // validation: any
}

export interface ILayer<E = string> {
  entities: Array<E>;
  rules?: Record<string, any>;
}

export interface IMatchFile {
  type: "file";
  name: string;
}

export interface IMatchDirectory {
  type: "directory";
  name: string;
  children?: Array<TMatches>;
}

export type TMatches = IMatchDirectory | IMatchFile;

/* ----- Rules & Validation ----- */

export type TNodeRulesNames = "nameLength" | "name" | "weight" | "isEmpty";

export type TFilesRulesNames = "extension" | "lineCount";

export type TDirRulesNames =
  | "childrenAmount"
  | "includes"
  | "excludes"
  | "children";

export type TSeverity = "error" | "warning";

export interface IBaseRule {
  type: TSeverity;
  message?: string;
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

export interface IExtensionRule extends IBaseRule {
  pattern: string;
}

export interface ILineCountRule extends IBaseRule {
  min?: number;
  max: number;
}

export interface IChildrenAmountRule extends IBaseRule {
  min?: number;
  max: number;
}

export type TChildrenRule = Array<IFileRule | IDirRule>;

export interface INodeRule {
  nameLength?: INameLengthRule;
  name?: INameRule;
  weight?: IWeightRule;
  isEmpty?: IBaseRule;
}

export interface IFileRule extends INodeRule {
  // type: "file";
  lineCount?: ILineCountRule;
}
export interface IDirRule extends INodeRule {
  // type: "directory";
  childrenAmount?: IChildrenAmountRule;
  includes?: Array<TMatches>;
  excludes?: Array<TMatches>;
  children?: TChildrenRule;
}

export type TEntityRule = IFileEntityRule | IDirEntityRule;

export interface IDirEntityRule extends IDirRule {
  custom?: (node: IDirEntity) => IBaseRule | true;
}
export interface IFileEntityRule extends IFileRule {
  custom?: (node: IFileEntity) => IBaseRule | true;
}
