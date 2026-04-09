export const MATCHING_ENTITY_ERRORS: Record<string, string> = {
  name: "Name of {{entity}} does not match the required pattern or convention.",
  children:
    "It looks as {{entity}}, but composition of child elements is invalid.",
};

export const MATCHING_GROUP_ERRORS: Record<string, string> = {
  hasValidChildren: "Composition of child elements is invalid",
  name: "Name of this group does not match the required pattern or convention.",
  children: "It looks as group, but composition of child elements is invalid.",
};

export const REGEX_CASES = {
  camelCase: "^[a-z]+([A-Z][a-z0-9]*)*",
  PascalCase: "^[A-Z][a-z0-9]*([A-Z][a-z0-9]*)*",
  snake_case: "^[a-z]+(_[a-z0-9]+)*",
  "kebab-case": "^[a-z]+(-[a-z0-9]+)*",
  other: "*",
};

export const GLOB_CASES = {
  camelCase: "[a-z][a-zA-Z]*",
  PascalCase: "[A-Z][a-zA-Z]*",
  snake_case: "[a-z]*(_[a-z]*)*",
  "kebab-case": "[a-z]*(-[a-z]*)*",
  other: "*",
};
