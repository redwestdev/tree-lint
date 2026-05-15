import { FileNode } from "@/core/nodes/FileNode.js";
import { IFileEntity } from "@/types/nodes.js";
import { IMatchFile, ITreeLintConfig, TEntityRule } from "@/types/config.js";
import { matchName } from "@/core/services/matcher/utils.js";
import { MATCHING_ENTITY_ERRORS } from "@/core/services/matcher/constants.js";
import { replacePlaceholders } from "@/utils/replace-placeholders.js";

export class FileEntity extends FileNode implements IFileEntity {
  private readonly rules: TEntityRule | undefined;
  public readonly entity: keyof ITreeLintConfig["entities"];

  constructor(
    node: FileNode,
    entity: keyof ITreeLintConfig["entities"],
    rules?: TEntityRule,
  ) {
    super(node);
    this.rules = rules;
    this.entity = entity;
  }

  static match(
    entityName: keyof ITreeLintConfig["entities"],
    node: FileNode,
    matches: IMatchFile,
    rules?: TEntityRule,
  ): FileEntity | FileNode {
    if ("custom" in matches) {
      // TODO: check with user's callback
      return node; // callback result
    }

    const result: Record<string, boolean> = {
      name: matchName(node.name, matches.name),
    };
    const isMatch = Object.values(result).every(Boolean);

    if (!isMatch && Object.values(result).some(Boolean)) {
      for (const key in result) {
        if (!result[key]) {
          const warn = replacePlaceholders(MATCHING_ENTITY_ERRORS[key], {
            entity: entityName,
          });
          node.addWarning(warn);
        }
      }
    }

    return isMatch ? new this(node, entityName, rules) : node;
  }

  validate() {
    if (!this.rules) return;

    if (this.rules.type !== "file") {
      this.addError(
        "There are different types for match and validation entity. Please, check your config",
      );

      return;
    }

    super.validate();
  }
}
