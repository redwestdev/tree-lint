import { AnyProjectNode } from "./nodes.js";

export type CustomMatch = (node: AnyProjectNode) => boolean;
export type EntityType = "file" | "directory";

export interface Match<L extends string> {
  namePattern: string; // regexp in glob syntax
  parentLayers: L[];
  type: EntityType | EntityType[];
  children?: string[] | Match<L>[]; // array of file names? matches for children?
  custom?: CustomMatch;
}

export interface Entity<L extends string> {
  naming?: string; // naming convention, 'camelCase', 'kebab-case', 'PascalCase' etc.
  type: EntityType | EntityType[];
  layers: L[]; // only existing layers in config ?
  rules: Record<string, string>;
  matches: Match<L>;
}
export interface Layer<L extends string, E extends string> {
  entities: E[]; // only existing entities in config ?
  allowedLayers?: L[]; // only existing layers in config ?
  maxDeep?: number; // 0 - no groups, > 0 - groups allowed
}

export interface TreeLintConfig<
  L extends string = string,
  E extends string = string,
> {
  roots: string[];
  ignore: string[];
  entities: Record<E, Entity<L>>;
  layers: Record<L, Layer<L, E>>;
  rules: Record<string, string>;
}
