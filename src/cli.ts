#!/usr/bin/env node

import { Command } from "commander";

import { initCommand } from "@/commands/init.js";
import { scanCommand } from "@/commands/scan.js";

const program = new Command();

program.name("tree-lint").description("Project tree linter").version("0.1.0");

/**
 * 'init' command: Sets up a configuration file in the current project.
 * 1. Detects whether the environment is interactive (TTY, non-CI).
 * 2. In non-interactive mode, requires all flags to be explicitly provided.
 * 3. In interactive mode, prompts the user for any missing options.
 * 4. Asks for confirmation before proceeding.
 * 5. Validates that all required options are present.
 * 6. Generates the configuration file in the specified format and type.
 */
program.addCommand(initCommand);

/**
 * 'scan' command: The core functionality.
 * 1. Loads and parse configuration.
 * 2. Validate paths.
 * 3. Builds a raw tree structure from the filesystem.
 * 4. Annotates the tree (layers, entities, groups).
 * 5. Validates the annotated tree based on rules.
 * 6. Logs results, optionally exports JSON, or displays performance metrics.
 */
program.addCommand(scanCommand);

program.parse(process.argv);
