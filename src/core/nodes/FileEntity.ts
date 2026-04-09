import { FileNode } from "@/core/nodes/FileNode.js";
import { TFileEntity } from "@/types/nodes.js";
import { IMatchFile, ITreeLintConfig, TMatches } from "@/types/config.js";
import { validationLogger } from "@/utils/index.js";
import { matchName } from "@/core/services/matcher/utils.js";
import { MATCHING_ERRORS } from "@/core/services/matcher/constants.js";
import { replacePlaceholders } from "@/utils/replace-placeholders.js";

export class FileEntity extends FileNode implements TFileEntity {
  private readonly rules: Record<string, string>;
  public readonly entity: keyof ITreeLintConfig["entities"];

  constructor(
    node: FileNode,
    entity: keyof ITreeLintConfig["entities"],
    rules: Record<string, string>,
  ) {
    super(node.name, node.path);
    this.rules = rules;
    this.entity = entity;
  }

  validate() {
    if (!this.isValid) {
      validationLogger(this.path, this.warnings, this.errors);
    }
  }

  static match(
    entityName: keyof ITreeLintConfig["entities"],
    node: FileNode,
    matches: IMatchFile,
  ): FileEntity | FileNode {
    if ("custom" in matches) {
      // TODO: check with user's callback
      return node; // callback result
    }

    const result: Record<string, boolean> = {
      name: matchName(node.name, matches.name),
    };
    const isMatch = Object.values(result).every(Boolean);

    if (!isMatch) {
      for (const key in result) {
        if (!result[key]) {
          const warn = replacePlaceholders(MATCHING_ERRORS[key], {
            entity: entityName,
          });
          node.addWarning(warn);
        }
      }
    }

    const rules: Record<string, string> = {};
    return isMatch ? new this(node, entityName, rules) : node;
  }
}
