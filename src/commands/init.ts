import chalk from "chalk";
import { Command, Option } from "commander";
import prompts, { type PromptObject } from "prompts";

import {
  createConfig,
  type IInitOptions,
} from "@/core/services/config/create-default-config.js";

const formatQn: PromptObject<string> = {
  type: "select",
  name: "format",
  message: "What format do you want for the configuration file?",
  choices: [
    {
      title: "TypeScript",
      description: "(Recommended)",
      value: "ts",
    },
    {
      title: "JavaScript",
      value: "js",
    },
    {
      title: "JSON",
      value: "json",
    },
    {
      title: "YAML",
      value: "yaml",
    },
  ],
  initial: 0,
};

const typeQn: PromptObject<string> = {
  type: "select",
  name: "type",
  message: "What type of configuration do you want to create?",
  choices: [
    {
      title: "default",
      description: "A basic configuration with common settings and rules",
      value: "default",
    },
    {
      title: "Deep Tree",
      description: "Configuration for Deep Tree architecture",
      value: "deep-tree",
    },
  ],
  initial: 1,
};

const OPTION_LABELS: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  json: "JSON",
  yaml: "YAML",
  default: "Default",
  "deep-tree": "Deep Tree",
};

/**
 * 'init' command: Sets up a configuration file in the current project.
 * 1. Detects whether the environment is interactive (TTY, non-CI).
 * 2. In non-interactive mode, requires all flags to be explicitly provided.
 * 3. In interactive mode, prompts the user for any missing options.
 * 4. Asks for confirmation before proceeding.
 * 5. Validates that all required options are present.
 * 6. Generates the configuration file in the specified format and type.
 */
export const initCommand = new Command("init")
  .description("Initialize a new tree-lint configuration")
  .addOption(
    new Option(
      "-f, --format <format>",
      "Format of the configuration file (ts, js, json, yaml)",
    ).choices(["ts", "js", "json", "yaml"]),
  )
  .addOption(
    new Option(
      "-t, --type <type>",
      "Type of default configuration to create (default, deep-tree)",
    ).choices(["default", "deep-tree"]),
  )
  .action(async (options: IInitOptions) => {
    try {
      const isInteractive =
        process.stdout.isTTY &&
        !process.env.CI &&
        process.env.NON_INTERACTIVE !== "true";

      if (!isInteractive && (!options.format || !options.type)) {
        console.error(
          chalk.red(
            "[Init error]: No options provided. In non-interactive environments, all required flags (--format, --type) must be specified.",
          ),
        );

        process.exit(1);
      }

      let isConfirmed = !isInteractive;
      let finalOptions: IInitOptions = {};
      let format = options.format;
      let type = options.type;

      while (!isConfirmed) {
        const questions: PromptObject<string>[] = [
          ...(!format ? [formatQn] : []),
          ...(!type ? [typeQn] : []),
        ];

        const answers = await prompts(questions, {
          onCancel: () => {
            console.log(chalk.cyan("\nOperation cancelled. Bye!"));
            process.exit(0);
          },
        });

        finalOptions = { type, format, ...answers };

        const confirmation = await prompts([
          {
            type: "confirm",
            name: "confirm",
            message: `You are about to create a configuration file with the following settings:
  ${finalOptions.format ? `• Format: ${OPTION_LABELS[finalOptions.format] || finalOptions.format}` : ""}
  ${finalOptions.type ? `• Type: ${OPTION_LABELS[finalOptions.type] || finalOptions.type}` : ""}

Do you want to proceed?`,
            initial: true,
          },
        ]);

        if (confirmation.confirm) {
          isConfirmed = true;
        } else {
          type = undefined;
          format = undefined;
        }
      }

      if (!isInteractive) {
        finalOptions = { format: options.format, type: options.type };
      }

      for (const option in finalOptions) {
        if (!finalOptions[option as keyof IInitOptions]) {
          console.error(
            chalk.red(
              `[Init error]: Missing required option: --${option}. Please specify it via flags or interactive prompt`,
            ),
          );
          process.exit(1);
        }
      }

      await createConfig(finalOptions);

      console.log(chalk.green("\nConfiguration file created successfully!"));
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }

      process.exit(1);
    }
  });
