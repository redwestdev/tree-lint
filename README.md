# Tree-lint

Tree-lint is a file structure linter that helps maintain architectural order and prevents chaos in projects.

> Tree-lint is not tied to a specific architecture. You define your architecture in the configuration, and Tree-lint checks for compliance. It supports Deep Tree, FSD, monorepos, and any other approaches where you can define distinct layers and entities.

## Why use Tree-lint?

The main tasks the linter covers are:

- **Architectural Integrity Control** - Allows you to fix rules for placing files and folders. The linter automatically monitors violations: for example, when components get into the utilities folder or project layers are mixed up.

- **Adherence to Team Agreements** - Turns architectural rules into a specification. This helps developers adhere to a unified development standard, minimizing disputes about where things should be placed.

- **Simplifying Onboarding** - The linter configuration serves as visual documentation. A new team member can quickly study the structure without wasting time looking for answers.

- **Flexible Work in Monorepos** - Allows you to set separate rules for different parts of the project. Each team can adhere to its own architecture without violating the general monorepo standards.

- **Legacy Project Audit** - The tool allows you to quickly assess the state of the file structure. This is indispensable when taking over projects with accumulated technical debt to understand how much the current organization of files corresponds to the target model.

- **Incremental Refactoring** - Introducing a new architecture to a legacy codebase? Enforce rules only on new code while ignoring old files via `ignore` patterns. No need to refactor everything at once to start benefiting from the linter.

## Installation

```bash
npm install -D tree-lint
# or
yarn add -D tree-lint
# or
pnpm add -D tree-lint
```

## Quick Start

### 1. Create a config

In the project root, run the command to create a config template:

```bash
tree-lint init
```

The command creates a `tree-lint.config` file in the current directory. Both interactive and non-interactive modes are supported.

**Interactive mode** (TTY terminal outside CI) — the command will prompt for any missing parameters and ask for confirmation before creating the file. If the selection is not satisfactory, you can go back and specify the parameters again.

**Non-interactive mode** (CI) — all parameters must be provided explicitly via flags:

```bash
tree-lint init --format ts --type deep-tree
```

| Flag         | Values             | Description               |
| ------------ | ------------------ | ------------------------- |
| -f, --format | ts, js, json, yaml | Configuration file format |
| -t, --type   | default, deep-tree | Configuration template    |

Example project structure:

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── index.ts
└── pages/
    └── Home/
```

and configuration file:

```typescript
import { createConfig } from "tree-lint";

export default createConfig({
  roots: ["src"], // directories to scan
  ignore: ["node_modules", "dist", "**/**/*.test.ts"], // exclusions, you can use patterns

  entities: {
    component: {
      matches: {
        type: "directory",
        name: "[A-Z]*",
        children: [
          { type: "file", name: "*.tsx" },
          { type: "file", name: "index.ts" },
        ],
      },
      rules: {
        nameLength: { type: "error", max: 20, min: 5 },
      },
    },
  },

  layers: {
    components: {
      entities: ["component"],
    },
  },
});
```

[More details about the validation rules](./docs/en/rules.md)

Supported configuration file formats:

- `tree-lint.config.ts` (recommended)
- `tree-lint.config.js`
- `tree-lint.config.json`
- `tree-lint.config.yaml`

When using configurations in `json` or `yaml` format, functionality will be limited (no support for custom rules via callback).

#### Security

> Configuration is executed as code (TypeScript).
>
> **Important:** Use Tree-lint only with trusted configurations. If you take a config from a third-party source, ensure its security, as it may contain malicious code.

### 2. Run scan

```bash
tree-lint scan
```

#### CLI Flags

Supported flags for the `scan` command:

| Flag                              | Description                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| `-t`, `--tree-output [file]`      | Export JSON tree                                                        |
| `-a`, `--annotated-output [file]` | Export annotated tree                                                   |
| `-v`, `--vitals`                  | Show performance metrics                                                |
| `-p`, `--print-tree`              | Print tree to the terminal                                              |
| `-c`, `--config-path [path]`      | Specify the path to the configuration (searches in the root by default) |
| `-g`, `--group-by <type>`         | Change the grouping of scan results (default is "path")                 |

Possible values for `--group-by`:

- `path` (default) - grouping by path in the file system:

  ```bash
  /src/views/HomePage/sections/MapSection/images/mw.svg
  ⚠ File size exceeds or falls short of the allowed configuration limits

  /src/views/HomePage/sections/MapSection/images/projects.svg
  ⚠ File size exceeds or falls short of the allowed configuration limits

  /src/views/HomePage/sections/MapSection
  ✖ Custom validation error: Custom rule must return a boolean, but returned object
  ```

- `severity` - grouping by error level (`error`, `warning`):

  ```bash
  ✖ ERRORS:
  Custom validation error: Custom rule must return a boolean, but returned object
    - /src/layouts/MainLayout/sections/FooterSct

  ⚠ WARNINGS:
  It looks as component, but composition of child elements is invalid.
    - /src/layouts/MainLayout/components/NewAwesomeComponent
  Name of section does not match the required pattern or convention.
    - /src/layouts/MainLayout/sections/.HeaderSct
  ```

- `rule` - grouping by the rule that was violated:

  ```bash
  It looks as component, but composition of child elements is invalid.
    ⚠ /src/layouts/MainLayout/components/NewAwesomeComponent

  Name of section does not match the required pattern or convention.
    ⚠ /src/layouts/MainLayout/sections/.HeaderSct

  Custom validation error: Custom rule must return a boolean, but returned object
    ✖ /src/layouts/MainLayout/sections/FooterSct
    ✖ /src/layouts/MainLayout/sections/SidebarSct
  ```

For convenience of running scans, you can add a script to `package.json`:

```json
{
  "scripts": {
    "lint:tree": "tree-lint scan"
  }
}
```

### 3. Check the scan result

```text
Errors: 0, warnings: 0.

✔ Validation complete successfully!
```

```text
/src/views/HomePage/sections/MapSection/images/mw.svg
⚠ File size exceeds or falls short of the allowed configuration limits

/src/views/HomePage/sections/MapSection/images/projects.svg
⚠ File size exceeds or falls short of the allowed configuration limits

/src/views/HomePage/sections/MapSection
✖ Custom validation error: Custom rule must return a boolean, but returned object

Errors: 1, warnings: 2.

✖ Validation failed.
```

## Architecture Examples

### Deep Tree

```bash
entities: {
  component: { /* ... */ },
  section: { /* ... */ },
  page: { /* ... */ },
  hook: { /* ... */ },
},

layers: {
  components: { entities: ["component"] },
  sections: { entities: ["section"] },
  pages: { entities: ["page"] },
  hooks: { entities: ["hook"] },
}
```

### Feature-Sliced Design (FSD)

```bash
entities: {
  feature: { /* ... */ },
  widget: { /* ... */ },
  entity: { /* ... */ },
},

layers: {
  app: { /* ... */ },
  pages: { /* ... */ },
  widgets: { entities: ["widget"] },
  features: { entities: ["feature"] },
  entities: { entities: ["entity"] },
  shared: { /* ... */ },
}
```

### Monorepo

```typescript
roots: ["packages/ui", "packages/core", "packages/api"],
// each root is scanned independently
```

## License

[MIT](./LICENSE)
