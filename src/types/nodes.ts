import {
  DirEntity,
  DirNode,
  FileEntity,
  FileNode,
  LayerNode,
} from "../core/index.js";

export type ProjectNode = FileNode | DirNode;

export type LayeredProjectNode = ProjectNode | LayerNode;

export type EntityProjectNode = LayeredProjectNode | DirEntity | FileEntity;

export type AnyProjectNode =
  | FileNode
  | DirNode
  | LayerNode
  | DirEntity
  | FileEntity;
