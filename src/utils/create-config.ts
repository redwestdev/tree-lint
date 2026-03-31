import { TreeLintConfig } from "../types/index.js";

export function createConfig<L extends string, E extends string>(
  config: TreeLintConfig<L, E>,
): TreeLintConfig<L, E> {
  return config;
}
