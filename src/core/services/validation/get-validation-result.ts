import {
  IValidationResult,
  IViolation,
  TGroupedByPath,
  TGroupedByRule,
  TGroupedBySeverity,
  TGroupOptions,
  TValidationStats,
} from "@/types/validation.js";

function groupByPath(violations: IViolation[]): TValidationStats {
  const stats: TValidationStats = {
    type: "path",
    errors: 0,
    warnings: 0,
    grouped: {},
  };
  stats.grouped = violations.reduce<TGroupedByPath>((acc, res) => {
    const { path, type, message } = res;

    if (!acc[path]) {
      acc[path] = { error: [], warning: [] };
    }
    const key = type as "error" | "warning";
    acc[path][key].push(message);

    if (key === "warning") stats.warnings += 1;
    else stats.errors += 1;

    return acc;
  }, {});

  return stats;
}

function groupBySeverity(violations: IViolation[]): TValidationStats {
  const stats: TValidationStats = {
    type: "severity",
    errors: 0,
    warnings: 0,
    grouped: { error: [], warning: [] },
  };

  stats.grouped = violations.reduce<TGroupedBySeverity>(
    (acc, res) => {
      const { path, type, message } = res;

      const key = type as "error" | "warning";
      acc[key].push({ message, path });

      if (key === "warning") stats.warnings += 1;
      else stats.errors += 1;

      return acc;
    },
    { error: [], warning: [] },
  );

  return stats;
}

function groupByRule(violations: IViolation[]): TValidationStats {
  const stats: TValidationStats = {
    type: "rule",
    errors: 0,
    warnings: 0,
    grouped: {},
  };

  stats.grouped = violations.reduce<TGroupedByRule>((acc, res) => {
    const { path, type, message } = res;

    if (!acc[message]) {
      acc[message] = { error: new Set(), warning: new Set() };
    }

    const key = type as "error" | "warning";
    acc[message][key].add(path);

    if (key === "warning") stats.warnings += 1;
    else stats.errors += 1;

    return acc;
  }, {});

  return stats;
}

export function getValidationResult(
  log: IValidationResult[],
  groupBy: TGroupOptions = "path",
): TValidationStats {
  const violations: IViolation[] = log
    .map((item) => {
      if (!item.result) return item.violation;
    })
    .filter((v) => v !== undefined);

  switch (groupBy) {
    case "rule":
      return groupByRule(violations);
    case "severity":
      return groupBySeverity(violations);
    case "path":
    default:
      return groupByPath(violations);
  }
}
