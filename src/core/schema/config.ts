import * as z from "zod";

import type {
  IDirEntityRuleConf,
  IDirRuleConf,
  IFileEntityRuleConf,
  IFileRuleConf,
  IGroupRuleConf,
  ILayerRuleConf,
  INodeRuleConf,
  TAnyRuleConf,
  TMatches,
} from "@/types/config.js";
import type {
  ICustomRule,
  IDirEntityRule,
  IDirRule,
  IFileEntityRule,
  IFileRule,
  IGroupRule,
  ILayerRule,
  INodeRule,
  TAnyRule,
  TSeverity,
} from "@/types/validation.js";

const PARAM_RULE_ERROR =
  'Expected "off" or a rule object with params, e.g. { type: "error", max: 20 }';

const MAX_ERRORS = 3;

const Severity = z.enum(["error", "warning", "off"]);

type TUnionIssue = {
  code?: string;
  path?: readonly PropertyKey[];
  message?: string;
};

const toUnionMessage = (issues: readonly TUnionIssue[]): string => {
  const parts = issues.slice(0, MAX_ERRORS).map((issue) => {
    const path = (issue.path ?? []).join(".");
    return path ? `${path}: ${issue.message}` : `${issue.message}`;
  });
  return parts.join("; ") || "Invalid input";
};

const unionError =
  (discriminatorPath?: readonly string[]) =>
  (params: unknown): string => {
    const branches = (params as { errors?: TUnionIssue[][] }).errors ?? [];
    let candidates = branches.filter((branch) => branch.length > 0);
    if (candidates.length === 0) return "Invalid input";

    if (discriminatorPath) {
      const matched = candidates.filter((branch) =>
        branch.every(
          (issue) =>
            issue.code !== "invalid_value" ||
            !discriminatorPath.every((key, i) => issue.path?.[i] === key),
        ),
      );
      if (matched.length === 0) {
        return toUnionMessage((candidates[0] ?? []).slice(0, 1));
      }
      candidates = matched;
    }

    const min = Math.min(...candidates.map((branch) => branch.length));
    const shortest = candidates.filter((branch) => branch.length === min);
    const branch =
      shortest.find((issues) => issues[0]?.code !== "unrecognized_keys") ??
      shortest[0] ??
      [];
    return toUnionMessage(branch);
  };

const ruleObjectError =
  (fallback: string) =>
  (params: unknown): string => {
    const branches = (params as { errors?: TUnionIssue[][] }).errors ?? [];
    const objectBranches = branches
      .slice(1)
      .filter((branch) => branch.length > 0);
    if (objectBranches.length === 0) return fallback;

    const notAnObject = objectBranches.every((branch) =>
      branch.some(
        (issue) =>
          issue.code === "invalid_type" && (issue.path ?? []).length === 0,
      ),
    );
    if (notAnObject) return fallback;

    const min = Math.min(...objectBranches.map((branch) => branch.length));
    const best = objectBranches.find((branch) => branch.length === min) ?? [];
    return toUnionMessage(best);
  };

const toRuleObject = <T extends z.ZodRawShape>(shape: T) =>
  z
    .strictObject({
      type: Severity,
      message: z.string().optional(),
      ...shape,
    })
    .transform((rule) => {
      const type = (rule as unknown as { type: TSeverity }).type;
      return type === "off" ? undefined : rule;
    });

const offShortcut = z.literal("off").transform(() => undefined);

const callback = z.custom<ICustomRule["callback"]>(
  (v) => typeof v === "function",
  "custom.callback must be a function",
);

const rule = <T extends z.ZodRawShape>(shape: T) =>
  z
    .union([offShortcut, toRuleObject(shape)], {
      error: ruleObjectError(PARAM_RULE_ERROR),
    })
    .optional();

const flagRule = <T extends z.ZodRawShape>(shape: T) =>
  z
    .union(
      [
        Severity.transform((type) => (type === "off" ? undefined : { type })),
        toRuleObject(shape),
      ],
      { error: ruleObjectError(PARAM_RULE_ERROR) },
    )
    .optional();

const MatchFile = z.strictObject({
  type: z.literal("file"),
  name: z.string().min(1),
});

const MatchDirectory = z.strictObject({
  type: z.literal("directory"),
  name: z.string().min(1),
  children: z.lazy(() => z.array(Matches)).optional(),
});

const Matches: z.ZodType<TMatches, TMatches> = z.discriminatedUnion("type", [
  MatchFile,
  MatchDirectory,
]);

const nodeShape = {
  matches: Matches.optional(),
  nameLength: rule({
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative(),
  }),
  name: rule({ pattern: z.string().min(1) }),
  size: z
    .union(
      [
        offShortcut,
        toRuleObject({
          min: z.number().nonnegative().optional(),
          max: z.number().nonnegative(),
        }),
        toRuleObject({
          min: z.number().nonnegative(),
          max: z.number().nonnegative().optional(),
        }),
      ],
      { error: ruleObjectError(PARAM_RULE_ERROR) },
    )
    .optional(),
};

const fileShape = {
  ...nodeShape,
  lineCount: rule({
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative(),
  }),
  isEmpty: flagRule({}),
};

const dirShape = {
  ...nodeShape,
  childrenAmount: rule({
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative(),
  }),
  children: z
    .union([offShortcut, z.array(z.lazy(() => AnyRule))], {
      error: ruleObjectError('Expected "off" or an array of child rules'),
    })
    .optional(),
};

const NodeRule: z.ZodType<INodeRule, INodeRuleConf> = z.strictObject(nodeShape);

const FileRule: z.ZodType<IFileRule, IFileRuleConf> = z.strictObject({
  ...fileShape,
  custom: rule({ callback }),
});

const FileEntityRule: z.ZodType<IFileEntityRule, IFileEntityRuleConf> =
  z.strictObject({
    ...fileShape,
    custom: rule({ callback }),
  });

const DirRule: z.ZodType<IDirRule, IDirRuleConf> = z.strictObject({
  ...dirShape,
  custom: rule({ callback }),
});

const DirEntityRule: z.ZodType<IDirEntityRule, IDirEntityRuleConf> =
  z.strictObject({
    ...dirShape,
    custom: rule({ callback }),
  });

const LayerRule: z.ZodType<ILayerRule, ILayerRuleConf> = z.strictObject({
  ...dirShape,
  custom: rule({ callback }),
});

const GroupRule: z.ZodType<IGroupRule, IGroupRuleConf> = z.strictObject({
  ...dirShape,
  custom: rule({ callback }),
});

const AnyRule: z.ZodType<TAnyRule, TAnyRuleConf> = z.union(
  [
    NodeRule,
    FileRule,
    DirRule,
    FileEntityRule,
    DirEntityRule,
    LayerRule,
    GroupRule,
  ],
  { error: unionError() },
);

const FileEntityConf = z.strictObject({
  matches: MatchFile,
  rules: FileEntityRule.optional(),
});

const DirEntityConf = z.strictObject({
  matches: MatchDirectory,
  entities: z.array(z.string().min(1)).optional(),
  rules: DirEntityRule.optional(),
});

const Entity = z.union([FileEntityConf, DirEntityConf], {
  error: unionError(["matches", "type"]),
});

const Layer = z.strictObject({
  entities: z.array(z.string().min(1)).min(1),
  rules: LayerRule.optional(),
});

const Group = z.strictObject({
  matches: MatchDirectory,
  rules: GroupRule.optional(),
});

export const ConfigSchema = z
  .strictObject({
    roots: z.array(z.string().min(1)).min(1).default(["."]),
    ignore: z.array(z.string()).default(["node_modules"]),
    entities: z.record(z.string(), Entity),
    layers: z.record(z.string(), Layer),
    groups: Group.optional(),
  })
  .superRefine((config, ctx) => {
    const known = new Set(Object.keys(config.entities));

    for (const [layerName, layer] of Object.entries(config.layers)) {
      layer.entities.forEach((ref, i) => {
        if (!known.has(ref)) {
          ctx.addIssue({
            code: "custom",
            path: ["layers", layerName, "entities", i],
            message: `Entity "${ref}" is not defined in "entities"`,
          });
        }
      });
    }
  });

export type TInternalConfig = z.output<typeof ConfigSchema>;
