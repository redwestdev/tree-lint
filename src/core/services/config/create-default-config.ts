import path from "path";
import fs from "fs/promises";
import { constants } from "node:fs/promises";

const baseTemplate = `
import { createConfig } from "tree-lint";

export default createConfig({
  roots: ["src"],
  ignore: ["node_modules", "dist", "build"],
  groups: {},
  entities: {},
  layers: {},
});
`;

// TODO: create default configs for different architectures

export async function createDefaultConfig(type = "default") {
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, "tree-lint.config.ts");
  let template;

  switch (type) {
    case "default":
    default:
      template = baseTemplate;
      break;
  }

  let isConfigExists;

  try {
    await fs.access(configPath, constants.F_OK);
    isConfigExists = true;
  } catch (_e) {
    isConfigExists = false;
  }

  if (isConfigExists) {
    throw new Error("Configuration file already exists.");
  }

  await fs.writeFile(configPath, template, "utf-8");
}
