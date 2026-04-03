import { AnyProjectNode } from "./nodes.js";

export type CustomMatch = (node: AnyProjectNode) => boolean;
// export type TEntityType = "file" | "directory";
export type TNaming =
  | "camelCase"
  | "PascalCase"
  | "kebab-case"
  | "snake_case"
  | "other";

export interface TreeLintConfig<
  L extends string = string,
  E extends string = string,
> {
  roots: string[];
  ignore: string[];
  layers: Record<L, Layer<E>>;
  entities: Record<E, IEntity>;
}

export interface IEntity {
  matches: TMatches;
}

export interface Layer<E = string> {
  entities: Array<E>; // only existing entities in config ?
}

export interface IMatchFile {
  type: "file";
  name: string; // regexp in glob syntax
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
