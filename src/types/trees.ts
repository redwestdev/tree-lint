import type { TAnyNode, TLayeredProjectNode, TProjectNode } from "./nodes.js";

export interface IProjectTree {
  generatedAt: string;
  trees: TProjectNode[];
}

export interface ILayeredProjectTree {
  generatedAt: string;
  trees: TLayeredProjectNode[];
}

export interface IEntityProjectTree {
  generatedAt: string;
  trees: TAnyNode[];
}

export interface IAnnotatedProjectTree {
  generatedAt: string;
  trees: TAnyNode[];
}

export type TAnyTree = IProjectTree | ILayeredProjectTree | IEntityProjectTree;
