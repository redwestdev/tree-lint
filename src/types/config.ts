import { TAnyNode } from "./nodes.js";

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
  roots: string[];
  ignore: string[];
  layers: Record<L, ILayer<E>>;
  entities: Record<E, IEntity>;
  groups?: IGroup;
}

export interface IEntity {
  matches: TMatches;
}

export interface IGroup {
  matches: {
    naming: TNaming;
    children?: Array<TMatches>;
  };
}

export interface ILayer<E = string> {
  entities: Array<E>;
}

export interface IMatchFile {
  type: "file";
  name: string;
}

export interface IMatchFileExtension {
  type: "file";
  naming: TNaming;
  extensions: string[];
}

export interface IMatchDirectory {
  type: "directory";
  name: string;
  children?: Array<TMatches>;
}

export type TMatches = IMatchDirectory | IMatchFileExtension | IMatchFile;
