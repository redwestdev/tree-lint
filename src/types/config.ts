import type {
  IDirEntityRule,
  IFileEntityRule,
  IGroupRule,
  ILayerRule,
} from "@/types/validation.js";
import type { TAnyNode } from "./nodes.js";

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

export interface IFileEntityConf {
  matches: IMatchFile;
  rules?: IFileEntityRule;
}
export interface IDirEntityConf {
  matches: IMatchDirectory;
  rules?: IDirEntityRule;
}

export type IEntity = IDirEntityConf | IFileEntityConf;

export interface IGroup {
  name?: string;
  children?: Array<TMatches>;
  rules?: IGroupRule;
}

export interface ILayer<E = string> {
  entities: Array<E>;
  rules?: ILayerRule;
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
