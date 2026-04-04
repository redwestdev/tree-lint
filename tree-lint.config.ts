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
      matches: {
        type: "directory",
        name: "/[A-Z]/",
        children: [
          {
            type: "directory",
            name: "component",
          },
          {
            type: "file",
            name: "use*.ts",
          },
          {
            type: "file",
            name: "index.ts",
          },
          {
            type: "file",
            naming: "camelCase",
            extensions: ["ts", "tsx"],
          },
        ],
      },
    },
    hook: {
      matches: {
        type: "file",
        name: "use*.ts", // name ONLY
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
    // ui: {
    //   entities: ["component"],
    // },
    // layouts: {
    //   entities: ["component"],
    // },
    // providers: {
    //   entities: ["component"],
    // },
    // managers: {
    //   entities: ["component"],
    // },
    // sections: {
    //   entities: ["section"],
    // },
    // pages: {
    //   entities: ["page"],
    // },
    // routes: {
    //   entities: ["route"],
    // },
    // images: {
    //   entities: ["image"],
    // },
  },
});
