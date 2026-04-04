import { TAnyNode } from "@/types/nodes.js";
import {
  DirEntity,
  DirNode,
  FileEntity,
  FileNode,
  LayerNode,
} from "@/core/nodes/index.js";

export function printProjectTree(
  node: TAnyNode,
  indent: string = "",
  isLast: boolean = true,
) {
  const marker = isLast ? "└── " : "├── ";

  const className =
    node.constructor.name !== "Object"
      ? node.constructor.name
      : node instanceof FileNode
        ? "File"
        : "Dir";
  const layerTag =
    node instanceof LayerNode && node.name
      ? ` \x1b[36m[Layer: ${node.name}]\x1b[0m`
      : "";
  const entityTag =
    (node instanceof DirEntity || node instanceof FileEntity) && node.entity
      ? ` \x1b[33m[Entity: ${node.entity}]\x1b[0m`
      : "";

  console.log(
    `${indent}${marker}${node.name} (${className})${layerTag}${entityTag}`,
  );

  const newIndent = indent + (isLast ? "    " : "│   ");

  if (node instanceof DirNode && node.children && node.children.length > 0) {
    node.children.forEach((child: TAnyNode, index: number) => {
      const lastChild = index === node.children.length - 1;
      printProjectTree(child, newIndent, lastChild);
    });
  }
}
