import fs, { constants } from "node:fs/promises";
import path from "node:path";

import chalk from "chalk";

export type TConfFormat = "ts" | "js" | "json" | "yaml";
export type TConfType = "default" | "deep-tree";

export interface IInitOptions {
  format?: TConfFormat;
  type?: TConfType;
}

function getTemplatePath(type: string, format: string): string {
  return path.join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "templates",
    "config",
    type,
    `tree-lint.${format}`,
  );
}

export async function createConfig(options?: IInitOptions) {
  if (!options?.type || !options?.format) return;

  const { type, format } = options;

  const rootDir = process.cwd();
  const templatePath = getTemplatePath(type, format);

  const configPath = path.join(rootDir, `tree-lint.config.${format}`);

  try {
    await fs.access(templatePath);
  } catch {
    console.error(
      chalk.red(
        `[Init error]: Invalid configuration type "${type}" or format "${format}". Please check your options.`,
      ),
    );
    process.exit(1);
  }

  try {
    await fs.copyFile(templatePath, configPath, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "EEXIST") {
        console.error(
          chalk.red(
            `Configuration file tree-lint.config.${format} already exists.`,
          ),
        );
        process.exit(1);
      }
    }
    throw error;
  }
}
