import { createConfig } from "tree-lint";

export default createConfig({
  roots: ["src"],
  ignore: ["node_modules", "dist", "build"],
  groups: {},
  entities: {},
  layers: {},
});
