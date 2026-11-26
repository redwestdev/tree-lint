import type { IValidationReport, IViolation } from "@/types/validation.js";

/**
 * Builds a machine-readable validation report for IDE and CI integrations.
 */
export function buildValidationReport(
  violations: IViolation[],
  projectRoot: string,
): IValidationReport {
  return {
    generatedAt: new Date().toISOString(),
    projectRoot,
    errors: violations.filter((v) => v.type === "error").length,
    warnings: violations.filter((v) => v.type === "warning").length,
    violations,
  };
}
