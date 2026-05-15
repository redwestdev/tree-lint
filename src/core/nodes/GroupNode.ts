import { DirNode } from "@/core/nodes/DirNode.js";
import { IGroupNode } from "@/types/nodes.js";
import { ITreeLintConfig } from "@/types/config.js";
import { matchChildren, matchName } from "@/core/services/matcher/utils.js";

import { MATCHING_GROUP_ERRORS } from "@/core/services/matcher/constants.js";
import { FileEntity } from "@/core/nodes/FileEntity.js";
import { DirEntity } from "@/core/nodes/DirEntity.js";

export class GroupNode extends DirNode implements IGroupNode {
  constructor(node: DirNode) {
    super(node, node.children);
  }

  static match(
    node: DirNode,
    config?: ITreeLintConfig["groups"],
  ): GroupNode | DirNode {
    if (!node.children.length) return node;

    const children: Set<string | undefined> = new Set(
      node.children
        .map((child) => {
          if (child instanceof GroupNode) {
            return "group";
          } else if (
            child instanceof FileEntity ||
            child instanceof DirEntity
          ) {
            return child.entity;
          } else return undefined;
        })
        .filter((name) => !!name),
    );

    if (children.size === 0) return node;

    const result: Record<string, boolean> = {
      hasValidChildren: children.size >= 1,
    };

    if (config?.name) result.name = matchName(node.name, config.name);
    if (config?.children)
      result.children = matchChildren(node.children, config.children);

    const isMatch = Object.values(result).every(Boolean);

    if (!isMatch && Object.values(result).some(Boolean)) {
      for (const key in result) {
        if (!result[key]) node.addWarning(MATCHING_GROUP_ERRORS[key]);
      }
    }

    return isMatch ? new this(node) : node;
  }

  validate() {
    // do something
    super.validate();
  }
}
