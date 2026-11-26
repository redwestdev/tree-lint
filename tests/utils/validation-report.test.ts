import { describe, expect, it } from "vitest";

import type { TValidationStats } from "@/types/validation.js";
import { buildValidationReport } from "@/utils/index.js";

const validationResult: TValidationStats = {
  type: "path",
  errors: 1,
  warnings: 2,
  grouped: {
    "/project/src/a.ts": { error: ["Bad name"], warning: [] },
    "/project/src/b.ts": { error: [], warning: ["Too large"] },
    "/project/src/c.ts": { error: [], warning: ["Too small"] },
  },
};

describe("buildValidationReport", () => {
  it("adds report metadata and removes the grouping type", () => {
    const report = buildValidationReport(validationResult, ["src"]);

    expect(report.root).toEqual(["src"]);
    expect(report.errors).toBe(1);
    expect(report.warnings).toBe(2);
    expect(report.grouped).toEqual(validationResult.grouped);
    expect(report).not.toHaveProperty("type");
    expect(Number.isNaN(Date.parse(report.generatedAt))).toBe(false);
  });

  it("converts rule-group sets to arrays", () => {
    const ruleResult: TValidationStats = {
      type: "rule",
      errors: 1,
      warnings: 1,
      grouped: {
        "Bad name": {
          error: new Set(["/project/src/a.ts"]),
          warning: new Set(),
        },
      },
    };

    const report = buildValidationReport(ruleResult, ["src"]);

    expect(report.grouped).toEqual({
      "Bad name": {
        error: ["/project/src/a.ts"],
        warning: [],
      },
    });
  });
});
