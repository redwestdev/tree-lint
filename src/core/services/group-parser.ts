import { IEntityProjectTree } from "@/types/trees.js";
import { ITreeLintConfig } from "@/types/config.js";

export function annotateGroups(
  tree: IEntityProjectTree,
  config: ITreeLintConfig,
) {
  console.log("annotate groups", config.groups);
  return tree;
}
