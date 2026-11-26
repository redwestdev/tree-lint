import { describe, expect, it } from "vitest";

import type { IViolation } from "@/types/validation.js";
import { buildValidationReport } from "@/utils/index.js";

const violations: IViolation[] = [
  { type: "error", path: "/project/src/a.ts", message: "Bad name" },
  { type: "warning", path: "/project/src/b.ts", message: "Too large" },
  { type: "warning", path: "/project/src/c.ts", message: "Too small" },
];

describe("buildValidationReport", () => {
  it("counts violations by severity and keeps their details", () => {
    const report = buildValidationReport(violations, "/project");

    expect(report.projectRoot).toBe("/project");
    expect(report.errors).toBe(1);
    expect(report.warnings).toBe(2);
    expect(report.violations).toEqual(violations);
    expect(Number.isNaN(Date.parse(report.generatedAt))).toBe(false);
  });
});
