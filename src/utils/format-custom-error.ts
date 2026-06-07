import type { IBaseRule } from "@/types/validation.js";

export function formatCustomError(e: unknown): IBaseRule {
  const errorMessage = e instanceof Error ? e.message : String(e);
  return {
    type: "error",
    message: `Custom validation error: ${errorMessage}`,
  };
}
