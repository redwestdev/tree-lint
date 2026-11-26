import * as z from "zod";

import type { TInternalConfig } from "@/core/schema/config.js";
import { ConfigSchema } from "@/core/schema/config.js";

const DOCS_URL = "https://github.com/redwestdev/tree-lint#readme";

export function parseConfig(config: unknown): TInternalConfig {
  const { data, success, error } = ConfigSchema.safeParse(config);

  if (!success) {
    const pretty = z.prettifyError(error);

    throw new Error(
      `[Config Error]:

${pretty}

Please fix the configuration file.
Docs: ${DOCS_URL}\n`,
    );
  }

  return data;
}
