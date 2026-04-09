#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { createJiti } from "jiti";

import { ITreeLintConfig } from "@/types/config.js";
import {
  printProjectTree,
  saveToJson,
  logScanPlan,
  validationLogger,
} from "@/utils/index.js";
import { TAnyNode } from "@/types/nodes.js";
import {
  annotateEntities,
  annotateGroups,
  annotateLayers,
  buildProjectTree,
} from "@/core/services/index.js";
import { DirNode } from "@/core/nodes/index.js";
import { countNodes, getVitals, printReport } from "@/utils/performance.js";

interface IScanOptions {
  treeOutput?: string | boolean;
  annotatedOutput?: string | boolean;
  vitals?: string | boolean;
  printTree?: string | boolean;
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
    "-t, --tree-output [file]",
    "Export the raw file system structure to a JSON file",
  )
  .option(
    "-a, --annotated-output [file]",
    "Export the processed tree (with identified layers, entities, and groups) to a JSON file",
  )
  .option(
    "-v, --vitals",
    "Display detailed engine performance metrics (CPU, Memory, and I/O efficiency)",
  )
  .option(
    "-p, --print-tree",
    "Render the analyzed project structure directly in the terminal",
  )
  .action(async (projectPath: string | undefined, options: IScanOptions) => {
    const resolvedPath = path.resolve(projectPath || ".");

    const spinner = ora("Scanning...").start();

    try {
      const start = getVitals();

      const configModule = await jiti.import(configPath);

      if (
        !configModule ||
        typeof configModule !== "object" ||
        !("default" in configModule)
      ) {
        spinner.fail(`File ${configPath} doesn't export default config`);
        process.exit(1);
      }

      const config = configModule.default as ITreeLintConfig;

      const rootsToScan = config.roots?.length
        ? config.roots.map((r: string) => path.join(resolvedPath, r))
        : [resolvedPath];

      logScanPlan(rootsToScan, config.ignore);

      const tree = await buildProjectTree(rootsToScan, config.ignore);

      const layeredTree = annotateLayers(tree, config);
      const entitiesTree = annotateEntities(layeredTree, config);
      const annotatedTree = annotateGroups(entitiesTree, config);

      if (options.printTree)
        annotatedTree.trees.forEach((node: TAnyNode) => printProjectTree(node));

      const validateNodes = (node: TAnyNode) => {
        if (node.warnings.length) validationLogger(node.path, node.warnings);

        if ("validate" in node) node.validate();
        if (node instanceof DirNode) {
          node.children.forEach((child: TAnyNode) => validateNodes(child));
        }
      };

      annotatedTree.trees.forEach((node: TAnyNode) => validateNodes(node));

      if (options.treeOutput !== undefined) {
        const outputPath =
          typeof options.treeOutput === "string"
            ? path.resolve(resolvedPath, options.treeOutput)
            : path.join(resolvedPath, ".project-tree.json");

        await saveToJson(tree, outputPath, resolvedPath);
      }

      if (options.annotatedOutput !== undefined) {
        const entitiesOutputPath =
          typeof options.annotatedOutput === "string"
            ? path.resolve(resolvedPath, options.annotatedOutput)
            : path.join(resolvedPath, ".entities-tree.json");

        await saveToJson(annotatedTree, entitiesOutputPath, resolvedPath);
      }

      if (options.vitals !== undefined) {
        const totalNodes = tree.trees.reduce(
          (acc, t) => acc + countNodes(t),
          0,
        );
        printReport(start, totalNodes);
      }

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
