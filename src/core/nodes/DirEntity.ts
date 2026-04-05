import { DirNode } from "@/core/nodes/DirNode.js";
import { IDirEntity } from "@/types/nodes.js";
import { ITreeLintConfig } from "@/types/config.js";
import { validationLogger } from "@/utils/index.js";

export class DirEntity extends DirNode implements IDirEntity {
  private readonly rules: Record<string, string>;
  public readonly entity: keyof ITreeLintConfig["entities"];

  constructor(
    node: DirNode,
    entity: keyof ITreeLintConfig["entities"],
    rules: Record<string, string>,
  ) {
    super(node.name, node.path, node.children);
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
