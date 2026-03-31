import { EntityProjectNode, LayeredProjectNode, ProjectNode } from "./nodes.js";

export interface ProjectTree {
  generatedAt: string;
  trees: ProjectNode[];
}

export interface LayeredProjectTree {
  generatedAt: string;
  trees: LayeredProjectNode[];
}

export interface EntityProjectTree {
  generatedAt: string;
  trees: EntityProjectNode[];
}

export type AnyTree = ProjectTree | LayeredProjectTree | EntityProjectTree;
