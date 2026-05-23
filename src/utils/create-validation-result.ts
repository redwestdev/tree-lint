import { IValidationResult, IBaseRule } from "@/types/validation.js";
import { VIOLATION_MESSAGES } from "@/core/services/validation/constants.js";

export function createValidationResult(
  result: boolean,
  nodePath: string,
  rule: IBaseRule,
  key: keyof typeof VIOLATION_MESSAGES,
): IValidationResult {
  if (result) {
    return { result: true };
  }

  return {
    result: false,
    violation: {
      type: rule.type,
      path: nodePath,
      message: rule.message || VIOLATION_MESSAGES[key],
    },
  };
}
