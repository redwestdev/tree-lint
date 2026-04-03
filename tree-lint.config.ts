import { createConfig } from "./src/utils/create-config.js";

export default createConfig({
  roots: ["src"],
  ignore: ["node_modules", "dist"],
  // groups: {
    // matches: {
      // naming: "camelCase?",
      // children: [
      //     {
      //       name: "index",
      //         type: "file",
      //       extensions: ["tsx", "ts"],
      //     },
      // ],
    // },
  // },
  entities: {
    component: {
      naming: "PascalCase",
      type: "directory",
      // layers: ["components"],
      // rules: {},
      matches: {
        type: "directory",
        // layers: ["hooks"],
        namePattern: "/[A-Z]/",
        // parentLayers: ["components", "ui", "layouts", "providers", "managers"],
        children: [
          {
            name: "components",
            type: "directory",
          },
          {
            name: "index",
            type: "file",
            extensions: ["tsx", "ts"],
          },
          {
            name: "/W",
            type: "file",
            extensions: ["tsx"],
          },
        ],
      },
    },
    section: {
      naming: "PascalCase",
      type: "directory",
      layers: ["sections"],
      // rules: {},
      matches: {
        namePattern: "*{Sct,Section}",
        parentLayers: ["sections"],
        type: "directory",
      },
    },
    page: {
      naming: "PascalCase",
      type: "directory",
      layers: ["pages"],
      matches: {
        namePattern: "*{Pg,Page}",
        parentLayers: ["pages"],
        type: "directory",
      },
      // rules: {},
    },
    hook: {
      naming: "camelCase",
      type: "file",
      layers: ["hooks"],
      // rules: {
      //   namePattern: "use*.ts",
      // },
      matches: {
        type: "file",
        extensions: ["tsx", "ts"],
        namePattern: "use*.ts", // name ONLY
        // parentLayers: ["hooks"],
        // children: [], // for type === 'directory'
      },
    },
    route: {
      naming: "camelCase",
      type: "file",
      layers: ["routes"],
      matches: {
        namePattern: "*.ts",
        parentLayers: ["routes"],
        type: "directory",
      },
      rules: {},
    },
    image: {
      type: "file",
      layers: ["images"],
      rules: {},
      matches: {
        namePattern: "*.{png,jpeg,jpg,gif,svg,webp,avif}",
        parentLayers: ["images"],
        type: "file",
      },
    },
  },
  layers: {
    components: {
      entities: ["component"],
    },
    ui: {
      entities: ["component"],
    },
    layouts: {
      entities: ["component"],
    },
    providers: {
      entities: ["component"],
    },
    managers: {
      entities: ["component"],
    },
    sections: {
      entities: ["section"],
    },
    pages: {
      entities: ["page"],
    },
    hooks: {
      entities: ["hook"],
      allowedLayers: ["components"],
      maxDeep: 0,
      // minDeep: 0,
      // groups rules
    },
    routes: {
      entities: ["route"],
    },
    images: {
      entities: ["image"],
    },
  },
  rules: {},
});
