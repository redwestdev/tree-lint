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
  entities: Record<E, IEntity>;
  layers: Record<L, Layer>;
}

export interface IEntity {
  matches: TMatches;
}

export interface Layer {
  entities: Array<keyof TreeLintConfig["entities"]>; // only existing entities in config ?
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
