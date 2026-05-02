import chalk from "chalk";
import { TAnyNode } from "@/types/nodes.js";
import {
  DirEntity,
  DirNode,
  FileEntity,
  FileNode,
  GroupNode,
  LayerNode,
} from "@/core/nodes/index.js";

const colors = {
  marker: chalk.gray,
  className: chalk.gray,
  layer: chalk.cyan,
  entity: chalk.yellow,
  group: chalk.blue,
  error: chalk.red.bold,
  invalidNode: chalk.red,
  excludedNode: chalk.gray.bold,
};

const EXCLUDE_REASONS: Record<string, string> = {
  hidden: "is hidden",
  unreadable: "access denied",
  ignored: "ignored by config",
};

const getReason = (node: TAnyNode) => {
  const reasons = [];
  const flags: Record<string, boolean> = {
    hidden: node.hidden || false,
    unreadable: node.unreadable || false,
    ignored: node.ignored || false,
  };

  for (const flag in flags) {
    if (flags[flag]) reasons.push(EXCLUDE_REASONS[flag]);
  }

  return reasons;
};

export function printProjectTree(
  node: TAnyNode,
  indent: string = "",
  isLast: boolean = true,
) {
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

  const groupTag =
    node instanceof GroupNode ? ` ${colors.group(`[Group]`)}` : "";

  const isExcluded = node.unreadable || node.ignored;
  const excludeTag = isExcluded
    ? `${colors.marker(`[Excluded: ${getReason(node).join(", ")}]`)}`
    : "";

  const nameDisplay = isExcluded
    ? colors.excludedNode(node.name)
    : node.isValid
      ? node.name
      : colors.invalidNode(`${colors.error("✖")} ${node.name}`);

  console.log(
    `${indent}${marker}${nameDisplay} ${className}${layerTag}${entityTag}${groupTag}${excludeTag}`,
  );

  const newIndent = indent + (isLast ? "    " : colors.marker("│   "));

  if (node instanceof DirNode && node.children && node.children.length > 0) {
    node.children.forEach((child: TAnyNode, index: number) => {
      const lastChild = index === node.children.length - 1;
      printProjectTree(child, newIndent, lastChild);
    });
  }
}
