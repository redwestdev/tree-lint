import { createConfig } from "./src/utils/create-config.js";

export default createConfig({
  roots: ["src"],
  ignore: ["node_modules", "dist"],
  groups: {
    matches: {
      naming: "camelCase",
      children: [
        {
          name: "index",
          type: "file",
          extensions: ["tsx", "ts"],
        },
      ],
    },
  },
  entities: {
    component: {
      matches: {
        type: "directory",
        name: "",
        children: [
          {
            type: "file",
            name: "index.ts",
          },
          {
            type: "file",
            naming: "PascalCase",
            extensions: ["ts", "tsx"],
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
  },
});
