import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { createJiti } from "jiti";
import yaml from "js-yaml";

export interface IGetConfig {
  config: unknown;
  projectRoot: string;
}

const extensions = [".ts", ".js", ".mjs", ".mts", ".json", ".yaml", ".yml"];

async function attempt<T = unknown>(
  fn: () => Promise<T> | T,
  message: string,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.log(e);
    throw new Error(message, { cause: e });
  }
}

function findConfigPath(customPath?: string): string | null {
  if (customPath) return path.resolve(process.cwd(), customPath);

  let current = process.cwd();
  while (true) {
    for (const ext of extensions) {
      const target = path.join(current, `tree-lint.config${ext}`);
      if (existsSync(target)) return target;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

export async function getConfig(customPath?: string): Promise<IGetConfig> {
  const configPath = findConfigPath(customPath);

  if (!configPath)
    throw new Error("[Config Error]: Configuration file not found.");

  let config: unknown;

  const rawExt = [".json", ".yaml", ".yml"];
  const confExt = path.extname(configPath);

  if (rawExt.includes(confExt)) {
    const raw = await attempt(
      () => fs.readFile(configPath, "utf8"),
      `[Config Error]: Cannot read file ${configPath}.`,
    );

    config = await attempt<unknown>(
      () => (confExt === ".json" ? JSON.parse(raw) : yaml.load(raw)),
      `[Config Error]: Failed to parse ${confExt.toUpperCase()} file ${configPath}.`,
    );
  } else {
    const jiti = createJiti(import.meta.url);
    const configModule = await attempt(
      () => jiti.import(configPath),
      `[Config Error]: Failed to load ${configPath}.`,
    );

    if (
      !configModule ||
      typeof configModule !== "object" ||
      !("default" in configModule)
    ) {
      throw new Error(
        `[Config Error]: File ${configPath} doesn't export default config.`,
      );
    }

    config = configModule.default;
  }

  return {
    config,
    projectRoot: configPath,
  };
}
