import { createConfig } from "./src/utils/create-config.js";

export default createConfig({
  roots: [],
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
    component: {
      matches: {
        type: "directory",
        name: "[A-Z]*",
        children: [
          {
            type: "file",
            name: "*.ts",
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
      entities: ["component"],
    },
    hooks: {
      entities: ["hook"],
    },
    sections: {
      entities: ["section"],
    },
  },
});
