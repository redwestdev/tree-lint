import { EntitySchema } from "../types/schema.js";

export const componentSchema: EntitySchema = {
  type: "component",
  displayName: "Component",
  description: "React компонент с бизнес-логикой",

  detection: {
    namePatterns: [
      {
        pattern: "^[A-Z][a-zA-Z0-9]+$",
        type: "regex",
        confidence: 0.6,
        description: "PascalCase имя",
      },
    ],

    locationRules: [
      {
        parentDirectory: "components",
        confidence: 0.9,
        description: "В папке components/",
      },
      {
        pathPattern: "**/components/**",
        confidence: 0.8,
      },
    ],

    fileRules: [
      {
        mustHave: ["*.tsx", "*.jsx"],
        confidence: 0.7,
        description: "Содержит React файлы",
      },
      {
        minFiles: 2,
        confidence: 0.5,
        description: "Минимум 2 файла",
      },
    ],

    priority: 5,
  },

  structure: {
    required: [
      {
        pattern: "index.{ts,tsx}",
        description: "Точка входа компонента",
      },
      {
        pattern: "{entityName}.{tsx,jsx}",
        description: "Главный файл компонента",
      },
    ],

    optional: [
      {
        pattern: "{entityName}.module.{css,scss}",
        description: "Стили компонента",
      },
      {
        pattern: "{entityName}.types.ts",
        description: "TypeScript типы",
      },
      {
        pattern: "{entityName}.test.{ts,tsx}",
        description: "Unit тесты",
      },
      {
        pattern: "{entityName}.stories.{ts,tsx}",
        description: "Storybook stories",
      },
      {
        pattern: "README.md",
        description: "Документация компонента",
      },
    ],

    forbidden: ["*.spec.js", "*.backup"],

    maxFiles: 15,
  },

  allowedLayers: ["components", "sections", "pages"],

  allowedChildren: ["component", "sections"],

  canBeRoot: false,

  options: {
    namingConvention: "PascalCase",
    maxChildDepth: 2,
  },
};
