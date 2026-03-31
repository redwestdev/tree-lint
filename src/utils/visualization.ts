import { AnyProjectNode } from "../types/index.js";
import { DirEntity, DirNode, FileEntity, LayerNode } from "../core/index.js";

export function printProjectTree(
  node: AnyProjectNode,
  indent: string = "",
  isLast: boolean = true,
) {
  const marker = isLast ? "└── " : "├── ";

  const className =
    node.constructor.name !== "Object"
      ? node.constructor.name
      : node.type === "file"
        ? "File"
        : "Dir";
  const layerTag =
    node instanceof LayerNode && node.layer
      ? ` \x1b[36m[Layer: ${node.layer}]\x1b[0m`
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
    node.children.forEach((child: AnyProjectNode, index: number) => {
      const lastChild = index === node.children.length - 1;
      printProjectTree(child, newIndent, lastChild);
    });
  }
}
