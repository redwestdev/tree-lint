import { createConfig } from "../../src/utils/create-config.js";

export default createConfig({
  roots: ["src"],
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
            name: "*.tsx",
          },
          {
            type: "file",
            name: "index.ts",
          },
        ],
      },
    },
    special: {
      matches: {
        type: "directory",
        name: "Special*",
        children: [
          {
            type: "file",
            name: "index.ts",
          },
          {
            type: "file",
            name: "*.tsx",
          },
        ],
      },
    },
  },
  layers: {
    components: {
      entities: ["special", "component"], // Сначала специальный, потом общий
    },
  },
});
