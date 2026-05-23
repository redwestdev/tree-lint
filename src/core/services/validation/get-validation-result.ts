import { IValidationResult, IViolation } from "@/types/validation.js";

type TGroupedByPath = Record<string, { error: string[]; warning: string[] }>;
export interface IValidationStats {
  errors: number;
  warnings: number;
  grouped: TGroupedByPath;
}

export function getValidationResult(
  log: IValidationResult[],
): IValidationStats {
  const stats: IValidationStats = {
    errors: 0,
    warnings: 0,
    grouped: {},
  };

  const violations: IViolation[] = log
    .map((item) => {
      if (!item.result) return item.violation;
    })
    .filter((v) => v !== undefined);

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
