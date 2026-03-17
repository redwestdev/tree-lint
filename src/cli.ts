#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { createJiti } from "jiti";

import { FileSystemScanner, ProjectNode } from "./core/file-system-scanner.js";
import { LayeredProjectNode, LayerParser } from "./core/layer-parser.js";
import { EntitiesParser, EntityProjectNode } from "./core/entities-parser.js";
import { saveToJson } from "./utils/file-utils.js";

export type CustomMatch = (
  node: ProjectNode | LayeredProjectNode | EntityProjectNode,
) => boolean;
export type EntityType = "file" | "directory";

export interface Match<L extends string> {
  namePattern: string; // regexp in glob syntax
  parentLayers: L[];
  type: EntityType | EntityType[];
  children?: string[] | Match<L>[]; // array of file names? matches for children?
  custom?: CustomMatch;
}

export interface Entity<L extends string> {
  naming?: string; // naming convention, 'camelCase', 'kebab-case', 'PascalCase' etc.
  type: EntityType | EntityType[];
  layers: L[]; // only existing layers in config ?
  rules: Record<string, string>;
  matches: Match<L>;
}
export interface Layer<L extends string, E extends string> {
  entities: E[]; // only existing entities in config ?
  allowedLayers?: L[]; // only existing layers in config ?
  maxDeep?: number; // 0 - no groups, > 0 - groups allowed
}

export interface TreeLintConfig<
  L extends string = string,
  E extends string = string,
> {
  roots: string[];
  ignore: string[];
  entities: Record<E, Entity<L>>;
  layers: Record<L, Layer<L, E>>;
  rules: Record<string, string>;
}

const jiti = createJiti(import.meta.url);
const configPath = path.resolve(process.cwd(), "tree-lint.config.ts");

const program = new Command();

program
  .name("tree-lint")
  .description("Project tree linter for React")
  .version("0.1.0");

program
  .command("scan [path]")
  .description("Scan the project and save structure to file")
  .option(
    "-o, --output [file]",
    "Optionally save the project tree to a JSON file",
  )
  .option(
    "-e, --entities-output [file]",
    "Optionally save the project tree enriched with layers and entities to a JSON file",
  )
  .action(async (projectPath = ".", options) => {
    const resolvedPath = path.resolve(projectPath);

    const spinner = ora("Scanning...").start();

    try {
      const startParseTime = Date.now();

      const configModule = await jiti.import(configPath);

      if (
        !configModule ||
        typeof configModule !== "object" ||
        !("default" in configModule)
      ) {
        spinner.fail(`File ${configPath} doesn't export default config`);
        process.exit(1);
      }

      const config = configModule.default as TreeLintConfig;

      const rootsToScan = config.roots?.length
        ? config.roots.map((r: string) => path.join(resolvedPath, r))
        : [resolvedPath];

      const fsScanner = new FileSystemScanner({
        roots: rootsToScan,
        ignore: config.ignore,
        cwd: resolvedPath,
      });

      fsScanner.logScanPlan();

      const tree = await fsScanner.scan();

      const layerParser = new LayerParser(config, tree);
      const layeredTree = layerParser.parse();

      const entitiesParser = new EntitiesParser(config, layeredTree);
      const outputTree = entitiesParser.parse();

      if (options.output !== undefined) {
        const outputPath =
          typeof options.output === "string"
            ? path.resolve(resolvedPath, options.output)
            : path.join(resolvedPath, ".project-tree.json");

        await saveToJson(tree, outputPath);
      }

      if (options.entitiesOutput !== undefined) {
        const entitiesOutputPath =
          typeof options.entitiesOutput === "string"
            ? path.resolve(resolvedPath, options.entitiesOutput)
            : path.join(resolvedPath, ".entities-tree.json");

        await saveToJson(outputTree, entitiesOutputPath);
      }

      const duration = Date.now() - startParseTime;
      spinner.succeed(`Structure parsed successfully (${duration}ms)`);

      process.exit(0);
    } catch (error) {
      spinner.fail("Error");

      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }

      process.exit(1);
    }
  });

program.parse(process.argv);
