import * as z from "zod";

import type { ITreeLintConfig } from "@/types/config.js";

const FileEntitySchema = z.looseObject({
  matches: z.object({
    type: z.literal("file"),
    name: z.string(),
  }),
});

const DirEntitySchema = z.looseObject({
  matches: z.looseObject({
    type: z.literal("directory"),
    name: z.string(),
  }),
});

const EntitySchema = z.union([FileEntitySchema, DirEntitySchema]);

export const ConfigSchema: z.ZodType<ITreeLintConfig> = z.looseObject({
  roots: z.array(z.string()).optional().default(["."]),
  ignore: z.array(z.string()).optional().default(["node_modules"]),
  entities: z.record(z.string(), EntitySchema),
  layers: z.record(
    z.string(),
    z.looseObject({
      entities: z.array(z.string()),
    }),
  ),
  groups: z.looseObject({}).optional(),
});
