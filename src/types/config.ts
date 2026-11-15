import type {
  IBaseRule,
  IChildrenAmountRule,
  ICustomDirEntityRule,
  ICustomDirRule,
  ICustomFileEntityRule,
  ICustomFileRule,
  ICustomGroupRule,
  ICustomLayerRule,
  ILineCountRule,
  INameLengthRule,
  INameRule,
  ISizeRule,
  TSeverity,
} from "./validation.js";

export type TRuleInput<T> = T | TSeverity;

export interface INodeRuleConf {
  matches?: TMatches;
  nameLength?: TRuleInput<INameLengthRule>;
  name?: TRuleInput<INameRule>;
  size?: TRuleInput<ISizeRule>;
}

export interface IFileRuleBaseConf extends INodeRuleConf {
  lineCount?: TRuleInput<ILineCountRule>;
  isEmpty?: TRuleInput<IBaseRule>;
}

export interface IDirRuleBaseConf extends INodeRuleConf {
  childrenAmount?: TRuleInput<IChildrenAmountRule>;
  children?: Array<TAnyRuleConf> | Extract<TSeverity, "off">;
}

export interface IFileRuleConf extends IFileRuleBaseConf {
  custom?: TRuleInput<ICustomFileRule>;
}

export interface IDirRuleConf extends IDirRuleBaseConf {
  custom?: TRuleInput<ICustomDirRule>;
}

export interface IDirEntityRuleConf extends IDirRuleBaseConf {
  custom?: TRuleInput<ICustomDirEntityRule>;
}
export interface IFileEntityRuleConf extends IFileRuleBaseConf {
  custom?: TRuleInput<ICustomFileEntityRule>;
}

export interface ILayerRuleConf extends IDirRuleBaseConf {
  custom?: TRuleInput<ICustomLayerRule>;
}
export interface IGroupRuleConf extends IDirRuleBaseConf {
  custom?: TRuleInput<ICustomGroupRule>;
}

export type TAnyRuleConf =
  | INodeRuleConf
  | IFileRuleConf
  | IDirRuleConf
  | IFileEntityRuleConf
  | IDirEntityRuleConf
  | ILayerRuleConf
  | IGroupRuleConf;

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

export interface IFileEntityConf {
  matches: IMatchFile;
  rules?: IFileEntityRuleConf;
}
export interface IDirEntityConf<E = string> {
  matches: IMatchDirectory;
  entities?: Array<E>;
  rules?: IDirEntityRuleConf;
}

export type IEntity = IDirEntityConf | IFileEntityConf;

export interface IGroup {
  matches: IMatchDirectory;
  rules?: IGroupRuleConf;
}

export interface ILayer<E = string> {
  entities: Array<E>;
  rules?: ILayerRuleConf;
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
