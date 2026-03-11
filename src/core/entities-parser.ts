import { TreeLintConfig } from "../cli.js";
import { LayeredProjectTreeResult } from "./layer-parser.js";

export class EntitiesParser {
  protected config: TreeLintConfig;
  protected tree: LayeredProjectTreeResult;

  constructor(config: TreeLintConfig, tree: LayeredProjectTreeResult) {
    this.config = config;
    this.tree = tree;
  }

  public parse(): LayeredProjectTreeResult {
    return this.tree;
  }
}
