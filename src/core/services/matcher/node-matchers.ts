import { IDirNode, IFileNode } from "@/types/nodes.js";
import {
  IMatchDirectory,
  IMatchFile,
  IMatchFileExtension,
  TMatches,
} from "@/types/config.js";
import { DirNode, FileNode } from "@/core/nodes/index.js";

import {
  matchChildren,
  matchExtension,
  matchName,
} from "@/core/services/matcher/utils.js";

export function matchNode(node: IDirNode | IFileNode, match: TMatches) {
  if (node instanceof FileNode) {
    return matchFile(node, match as IMatchFile | IMatchFileExtension);
  }

  if (node instanceof DirNode) {
    return matchDirectory(node, match as IMatchDirectory);
  }

  return {};
}

export function matchFile(
  node: IFileNode,
  matches: IMatchFile | IMatchFileExtension,
): Record<string, boolean> {
  if ("custom" in matches) {
    // TODO: check with user's callback
    return { custom: true }; // callback result
  }

  const result: Record<string, boolean> = {};
  const nameMatch: string = "naming" in matches ? matches.naming : matches.name;

  result.name = matchName(node.name, nameMatch);

  if ("extensions" in matches)
    result.extensions = matchExtension(node, matches.extensions);

  return result;
}

export function matchDirectory(
  node: IDirNode,
  matches: IMatchDirectory,
): Record<string, boolean> {
  if ("custom" in matches) {
    // TODO: check with user's callback
    return { custom: true }; // callback result
  }

  const result: Record<string, boolean> = {};

  result.name = matchName(node.name, matches.name);
  result.childrenLength = node.children.length > 0;

  if (matches.children)
    result.children = matchChildren(node.children, matches.children);

  return result;
}
