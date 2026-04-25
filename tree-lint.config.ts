import { createConfig } from "./src/index.js";

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
      rules: {
        type: "directory",
        "name-length": { type: "error", max: 20, min: 5 },
        name: "", // regexp or naming convention
        "files-amount": { type: "warning", max: 10, min: 2 },
        weight: { type: "error", max: 20, min: 2 }, // kB; > 20 ==> warning
        "is-empty": "error", // warning
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
        children: [
          // common rules for children
          {
            type: "file",
            "name-length": { type: "error", max: 20, min: 5 },
            name: "", // regexp or naming convention
            extension: "{png,tsx}",
            weight: { type: "error", max: 20, min: 2 }, // kB; > 20 ==> warning
            "lines-count": { type: "warning", max: 200, min: 2 },
            "is-empty": "error", // warning
            custom: () => {
              return {
                type: "error | warning",
                message: "Some error message",
              };
            },
          },
          {
            type: "directory",
            "name-length": { type: "error", max: 20, min: 5 },
            name: "", // regexp or naming convention
            "files-amount": 5,
            weight: { type: "error", max: 20, min: 2 }, // kB; > 20 ==> warning
            "is-empty": "error", // warning
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
            children: [
              // rules for children's children
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
        "name-length": { type: "error", max: 20, min: 5 },
        name: "", // regexp or naming convention
        "file-extensions": "{png,tsx}",
        "entity-weight": { type: "error", max: 20, min: 2 }, // kB; > 20 ==> warning
        "lines-count": { type: "warning", max: 200, min: 2 },
        "is-empty": "error", // warning, off
      },
    },
  },
  layers: {
    components: {
      entities: ["multi-component", "component"],
      rules: {
        "allow-nested-layers": true, // first layer
        "should-include-file": [
          {
            name: "index", // regexp or naming convention
            "file-extensions": "ts",
          },
        ],
        "file-for-exclude": [{}],
      },
    },
    hooks: {
      entities: ["hook"],
    },
    sections: {
      entities: ["section"],
    },
  },
});
