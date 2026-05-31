import { ITreeLintConfig } from "@/types/config.js";
import { ConfigSchema } from "@/core/services/config/schema.js";
import * as z from "zod";

export type IInternalConfig = ITreeLintConfig;

function checkEntities(config: IInternalConfig) {
  const { layers, entities } = config;
  const entityKeys = new Set(Object.keys(entities));

  for (const layer in layers) {
    for (const entityRef of layers[layer].entities) {
      if (!entityKeys.has(entityRef)) {
        throw new Error(
          `[Config Error]: Entity "${entityRef}" does not exist, please define it in "entities"`,
        );
      }
    }
  }
}

export function parseConfig(config: unknown): IInternalConfig {
  const { data, success, error } = ConfigSchema.safeParse(config);

  if (!success) {
    const pretty = z.prettifyError(error);
    throw new Error(
      `[Config Error]:
      \n${pretty}
      \nPlease fix the configuration file.
      \n [link to documentation will be here]`,
    );
  } else {
    checkEntities(data);
    return data;
  }
}
