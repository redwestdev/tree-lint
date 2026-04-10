import { createConfig } from "../../src/utils/create-config.js";

export default createConfig({
  roots: ["src", "src/components"], // Нахлёст корней
  ignore: ["node_modules", "dist"],
  groups: {
    name: "[a-z]*",
    children: [
      {
        type: "file",
        name: "index.ts",
      },
    ],
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
    },
    hook: {
      matches: {
        type: "file",
        name: "use*.ts",
      },
    },
  },
  layers: {
    components: {
      entities: ["multi-component", "component"],
    },
    hooks: {
      entities: ["hook"],
    },
    sections: {
      entities: ["section"],
    },
  },
});
