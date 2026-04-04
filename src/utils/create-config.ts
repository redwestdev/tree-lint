import { ITreeLintConfig } from "@/types/config.js";

export function createConfig<L extends string, E extends string>(
  config: ITreeLintConfig<L, E>,
): ITreeLintConfig<L, E> {
  return config;
}
