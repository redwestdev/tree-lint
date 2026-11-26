import type {
  IValidationReport,
  TValidationStats,
} from "@/types/validation.js";

/**
 * Builds a machine-readable validation report for IDE and CI integrations.
 */
export function buildValidationReport(
  validationResult: TValidationStats,
  roots: string[],
): IValidationReport {
  const { type, grouped, ...stats } = validationResult;
  const reportGrouped =
    type === "rule"
      ? Object.fromEntries(
          Object.entries(grouped).map(([rule, paths]) => [
            rule,
            {
              error: [...paths.error],
              warning: [...paths.warning],
            },
          ]),
        )
      : grouped;

  return {
    generatedAt: new Date().toISOString(),
    root: roots,
    ...stats,
    grouped: reportGrouped,
  };
}
