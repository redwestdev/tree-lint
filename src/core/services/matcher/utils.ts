import mm from "micromatch";

import { TMatches } from "@/types/config.js";
import { TAnyNode, TNodeType } from "@/types/nodes.js";
import { DirNode, FileNode } from "@/core/nodes/index.js";

export const matchName = (name: string, match: string): boolean => {
  if (!match.length) return true;

  return mm.isMatch(name, match);
};

export const matchType = (node: TAnyNode, type: TNodeType) => {
  if (node instanceof DirNode && type === "directory") return true;
  return node instanceof FileNode && type === "file";
};

export const matchChildren = (
  children: TAnyNode[],
  matches: TMatches[],
): boolean => {
  const result: boolean[] = [];
  let childrenArr: TAnyNode[] = [...children];

  for (const match of matches) {
    let wasFound = false;
    for (const child of childrenArr) {
      const result: Record<string, boolean> = {
        name: matchName(child.name, match.name),
        type: matchType(child, match.type),
      };

      if ("children" in match && match.children && child instanceof DirNode)
        result.children = matchChildren(child.children, match.children);

      const isMatch = Object.values(result).every(Boolean);
      if (isMatch) {
        wasFound = true;
        childrenArr = [
          ...childrenArr.filter((item) => item.name !== child.name),
        ];
        break;
      }
    }
    result.push(wasFound);
  }

  return result.every(Boolean);
};
