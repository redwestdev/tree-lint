import mm from "micromatch";

import { TMatches, TNaming } from "@/types/config.js";
import { FileNode } from "@/core/nodes/index.js";
import { TAnyNode } from "@/types/nodes.js";
import { matchNode } from "@/core/services/matcher/node-matchers.js";

export const NAMING_PATTERNS: Record<TNaming, string> = {
  camelCase: "^[a-z][a-zA-Z0-9]*$",
  PascalCase: "^[A-Z][a-zA-Z0-9]*$",
  "kebab-case": "^[a-z0-9]+(-[a-z0-9]+)*$",
  snake_case: "^[a-z0-9]+(_[a-z0-9]+)*$",
  other: "*",
};

export const matchName = (name: string, match: string): boolean => {
  if (!match.length) return true;

  const isConvention = Object.keys(NAMING_PATTERNS).includes(match);
  const expression: string = isConvention
    ? NAMING_PATTERNS[match as TNaming]
    : match;

  return mm.isMatch(name, expression);
};

export const matchExtension = (node: TAnyNode, extensions: string[]) => {
  if (node instanceof FileNode) return extensions.includes(node.extension);
  return false;
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
      if (child.type !== match.type) continue;

      const result = matchNode(child, match);
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
