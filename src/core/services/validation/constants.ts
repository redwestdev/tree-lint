export const VIOLATION_MESSAGES: Record<string, string> = {
  nameLength: "Name length is outside the allowed character limits",
  name: "Name does not match the required pattern",
  size: "File size exceeds or falls short of the allowed configuration limits",
  lines: "Line count in this file violates the maximum or minimum threshold",
  childrenAmount: "The directory contains an invalid number of nested elements",
  custom: "The element failed to meet specific custom rules",
};
