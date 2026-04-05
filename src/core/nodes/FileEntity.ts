import { FileNode } from "@/core/nodes/FileNode.js";
import { TFileEntity } from "@/types/nodes.js";
import { ITreeLintConfig } from "@/types/config.js";
import { validationLogger } from "@/utils/index.js";

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
    this.isValid = node.isValid;
    this.errors = node.errors;
    this.warnings = node.warnings;
  }

  validate() {
    if (!this.isValid) {
      validationLogger(this.path, this.warnings, this.errors);
    }
  }
}
