import { describe, expect, it } from "vitest";

import { getViolations } from "@/core/services/validation/get-validation-result.js";
import type { IValidationResult } from "@/types/validation.js";

const log: IValidationResult[] = [
  { result: true },
  {
    result: false,
    violation: {
      type: "error",
      path: "/project/src/a.ts",
      message: "Bad name",
    },
  },
  {
    result: false,
    violation: {
      type: "warning",
      path: "/project/src/b.ts",
      message: "Too large",
    },
  },
];

describe("getViolations", () => {
  it("returns only failed validation results", () => {
    expect(getViolations(log)).toEqual([
      { type: "error", path: "/project/src/a.ts", message: "Bad name" },
      { type: "warning", path: "/project/src/b.ts", message: "Too large" },
    ]);
  });
});
