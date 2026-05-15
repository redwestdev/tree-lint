import { IDirRule, INodeRule } from "@/types/config.js";

export const NODE_RULE_KEYS: Array<keyof INodeRule> = [
  "nameLength",
  "name",
  "weight",
  "isEmpty",
];

export const DIR_RULE_KEYS: Array<keyof IDirRule> = [
  ...NODE_RULE_KEYS,
  "type",
  "childrenAmount",
  "includes",
  "excludes",
  "children",
];

export const VIOLATION_MESSAGES: Record<string, string> = {
  nameLength: "Invalid name length",
  childrenAmount: "Invalid number of children",
  custom: "Custom check failed",
};
