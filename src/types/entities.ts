export interface FileNode {
  path: string;
  name: string;
  extension: string;
  type: "file" | "directory";
}

export type EntityType = "page" | "section" | "component";

export interface Entity {
  type: EntityType;
  path: string;
  name: string;
  files: FileNode[];
  children?: Entity[];
  parent?: Entity;
  detectionSource?: "suffix" | "parent-directory" | "default";
}
