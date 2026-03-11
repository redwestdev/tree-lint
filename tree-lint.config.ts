export default {
  roots: ["src"],
  ignore: ["node_modules", "dist"],
  //"groups": {},
  entities: {
    component: {
      //
      naming: "PascalCase",
      type: "directory",
      layer: "components",
      rules: {},
      matches: {
        // how to define entity
      },
    },
    section: {
      naming: "PascalCase",
      type: "directory",
      layer: "sections",
      rules: {},
      matches: {},
    },
    page: {
      naming: "PascalCase",
      type: "directory",
      layer: "pages",
      rules: {},
      matches: {},
    },
    hook: {
      naming: "camelCase",
      type: "file",
      layer: "hooks",
      rules: {
        namePattern: "use*.ts",
      },
      matches: {
        namePattern: "use*.ts",
        parentLayer: "hooks",
      },
    },
    route: {
      naming: "camelCase",
      type: "file",
      layer: "routes",
      rules: {},
    },
    image: {
      type: "file",
      layer: "images",
      rules: {},
      matches: {
        extensions: ["png", "jpg", "jpeg", "svg"],
      },
    },
  },
  layers: {
    components: {
      entities: "component",
    },
    ui: {
      entities: "component",
    },
    layouts: {
      entities: "layout",
    },
    providers: {
      entities: "provider",
    },
    managers: {
      entities: "manager",
    },
    sections: {
      entities: "section",
    },
    pages: {
      entities: "page",
    },
    hooks: {
      entities: "hook",
      layers: ["components"],
      maxDeep: 0,
      // minDeep: 0,
      // groups rules
    },
    routes: {
      entities: "route",
    },
    images: {
      entities: "image",
    },
  },
  rules: {},
};
