import { describe, expect, it } from "vitest";

import { getValidationResult } from "@/core/services/validation/get-validation-result.js";
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

describe("getValidationResult", () => {
  it("groups violations from failed validation results by path", () => {
    expect(getValidationResult(log)).toEqual({
      type: "path",
      errors: 1,
      warnings: 1,
      grouped: {
        "/project/src/a.ts": { error: ["Bad name"], warning: [] },
        "/project/src/b.ts": { error: [], warning: ["Too large"] },
      },
    });
  });
});
