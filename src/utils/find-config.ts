import { createJiti } from "jiti";
import path from "path";
import { ITreeLintConfig } from "@/types/config.js";
import { existsSync } from "node:fs";

export async function getConfig() {
  const jiti = createJiti(import.meta.url);
  let current = process.cwd();
  let configPath = null;

  while (true) {
    const target = path.join(current, "tree-lint.config.ts");
    if (existsSync(target)) {
      configPath = target;
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  if (!configPath) {
    throw new Error("Configuration file not found.");
  } else {
    const configModule = await jiti.import(configPath);

    if (
      !configModule ||
      typeof configModule !== "object" ||
      !("default" in configModule)
    ) {
      throw new Error(`File ${configPath} doesn't export default config.`);
    }

    return {
      config: configModule.default as ITreeLintConfig,
      projectRoot: configPath,
    };
  }
}
