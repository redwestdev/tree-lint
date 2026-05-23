import { createConfig } from "@/index.js";

export default createConfig({
  roots: ["src"],
  ignore: ["node_modules", "dist"], // regexp
  groups: {
    name: "[a-z]*",
    children: [
      {
        type: "file",
        name: "index.ts",
      },
    ],
    rules: {
      isEmpty: { type: "error" }, // check one type of entities
    },
  },
  entities: {
    "multi-component": {
      matches: {
        type: "directory",
        name: "Multi*",
        children: [
          { type: "file", name: "*.tsx" },
          { type: "file", name: "*.tsx" },
        ],
      },
    },
    component: {
      matches: {
        type: "directory",
        name: "[A-Z]*",
        children: [
          {
            type: "file",
            name: "*.tsx",
          },
          {
            type: "file",
            name: "index.ts",
          },
        ],
      },
      rules: {},
    },
    section: {
      matches: {
        type: "directory",
        name: "[A-Z]*{Sct,Section}",
        children: [
          {
            type: "file",
            name: "*.tsx",
          },
        ],
      },
      rules: {
        nameLength: { type: "error", max: 20, min: 5 },
        name: { type: "error", pattern: "PascalCase" },
        childrenAmount: { type: "warning", max: 10, min: 2 },
        size: { type: "error", max: 20, min: 2 },
        isEmpty: { type: "warning" },
        excludes: [
          {
            type: "directory",
            name: "*",
          },
        ],
        children: [
          {
            _matches: {
              type: "file",
              name: "*",
            },
            nameLength: { type: "error", max: 20, min: 5 },
            name: { type: "error", pattern: "" },
            size: { type: "error", max: 20, min: 2 },
            lineCount: { type: "warning", max: 200, min: 2 },
            isEmpty: { type: "warning" },
            custom: {
              type: "error",
              callback: () => {
                return false;
              },
              message: "Help me, I'm a vibecoder!",
            },
          },
          {
            _matches: {
              type: "directory",
              name: "[A-Z]*",
            },
            nameLength: { type: "error", max: 20, min: 5 },
            name: { type: "error", pattern: "" },
            childrenAmount: { type: "warning", max: 10, min: 2 },
            size: { type: "error", max: 20, min: 2 },
            isEmpty: { type: "warning" },
            includes: [
              {
                type: "file",
                name: "*.{tsx,ts}",
              },
            ],
            excludes: [
              {
                type: "directory",
                name: "*",
              },
            ],
          },
        ],
      },
    },
    hook: {
      matches: {
        type: "file",
        name: "use*",
      },
      rules: {
        name: { type: "error", pattern: "use*" },
      },
    },
  },
  layers: {
    components: {
      entities: ["multi-component", "component"],
    },
    hooks: {
      entities: ["hook"],
      rules: {
        children: [
          {
            name: { type: "error", pattern: "use*.{ts,tsx}" },
          },
        ],
      },
    },
    sections: {
      entities: ["section"],
    },
  },
});
