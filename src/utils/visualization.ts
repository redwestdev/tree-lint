import chalk from "chalk";
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
  const colors = {
    marker: chalk.gray,
    className: chalk.gray,
    layer: chalk.cyan,
    entity: chalk.yellow,
    error: chalk.red.bold,
    invalidNode: chalk.red,
  };

  const marker = colors.marker(isLast ? "└── " : "├── ");

  const classNameRaw =
    node.constructor.name !== "Object"
      ? node.constructor.name
      : node instanceof FileNode
        ? "File"
        : "Dir";

  const className = colors.className(`(${classNameRaw})`);

  const layerTag =
    node instanceof LayerNode && node.name
      ? ` ${colors.layer(`[Layer: ${node.name}]`)}`
      : "";

  const entityTag =
    (node instanceof DirEntity || node instanceof FileEntity) && node.entity
      ? ` ${colors.entity(`[Entity: ${node.entity}]`)}`
      : "";

  const nameDisplay = node.isValid
    ? node.name
    : colors.invalidNode(`${colors.error("✖")} ${node.name}`);

  console.log(
    `${indent}${marker}${nameDisplay} ${className}${layerTag}${entityTag}`,
  );

  const newIndent = indent + (isLast ? "    " : colors.marker("│   "));

  if (node instanceof DirNode && node.children && node.children.length > 0) {
    node.children.forEach((child: TAnyNode, index: number) => {
      const lastChild = index === node.children.length - 1;
      printProjectTree(child, newIndent, lastChild);
    });
  }
}
