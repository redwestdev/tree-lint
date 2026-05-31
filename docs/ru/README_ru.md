# Tree-lint

Tree-lint - это линтер для файловой структуры, который помогает поддерживать архитектурный порядок и предотвращать хаос в проекте.

> Tree-lint не привязан к конкретной архитектуре. Вы описываете свою архитектуру в конфиге, Tree-lint проверяет соответствие. Поддерживает Deep Tree, FSD, монорепо и любые другие подходы, при которых можно выделить отдельные слои и сущности.

## Зачем использовать Tree-lint?

Основные задачи, которые закрывает линтер:

- **Контроль архитектурной целостности** - позволяет зафиксировать правила размещения файлов и папок. Линтер автоматически отслеживает нарушения: например, когда компоненты попадают в папку утилит или слои проекта перемешиваются.

- **Соблюдение командных договоренностей** - превращает архитектурные правила в спецификацию. Это помогает разработчикам придерживаться единого стандарта разработки, минимизируя споры о том, где здесь всё должно лежать.

- **Упрощение онбординга** - конфигурация линтера служит наглядной документацией. Новый участник команды может быстро изучить структуру, не тратя время на поиск ответов.

- **Гибкая работа в монорепо** - позволяет настраивать отдельные правила для разных частей проекта. Каждая команда может придерживаться своей архитектуры, не нарушая общих стандартов монорепозитория.

- **Аудит легаси-проектов** - инструмент позволяет быстро оценить состояние файловой структуры. Это незаменимо при принятии проектов с накопленным техническим долгом, чтобы понять, насколько текущая организация файлов соответствует целевой модели.

## Установка

```bash
npm install -D tree-lint
# или
yarn add -D tree-lint
# или
pnpm add -D tree-lint
```

## Быстрый старт

### 1. Создайте конфиг

В корне проекта выполните команду для создания шаблона конфига:

```bash
tree-lint init
```

Это создаст файл `tree-lint.config.ts` с базовой структурой. Отредактируйте его, чтобы описать свою архитектуру.

Пример структуры проекта:

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── index.ts
└── pages/
    └── Home/
```

и файла конфигурации:

```typescript
import { createConfig } from "tree-lint";

export default createConfig({
  roots: ["src"], // директории для сканирования
  ignore: ["node_modules", "dist", "**/**/*.test.ts"], // исключения, можно использовать паттерны

  entities: {
    component: {
      matches: {
        type: "directory",
        name: "[A-Z]*",
        children: [
          { type: "file", name: "*.tsx" },
          { type: "file", name: "index.ts" },
        ],
      },
      rules: {
        nameLength: { type: "error", max: 20, min: 5 },
      },
    },
  },

  layers: {
    components: {
      entities: ["component"],
    },
  },
});
```

Поддерживаемые форматы файлов конфигурации:

- `tree-lint.config.ts` (рекомендуется)
- `tree-lint.config.js`
- `tree-lint.config.json`
- `tree-lint.config.yaml`

При использовании конфигураций в формате `json` или `yaml` функциональность будет ограничена (нет поддержки кастомных правил через callback).

#### Безопасность

> Конфигурация выполняется как код (TypeScript).
>
> **Важно:** Используйте Tree-lint только с доверенными конфигурациями. Если вы берете конфиг из стороннего источника, убедитесь в его безопасности, так как он может содержать вредоносный код.

### 2. Запустите сканирование

```bash
tree-lint scan
```

#### Флаги CLI

Поддерживаемые флаги для команды `scan`:

| Флаг                              | Описание                                                            |
| --------------------------------- | ------------------------------------------------------------------- |
| `-t`, `--tree-output [file]`      | Экспортировать JSON-дерево                                          |
| `-a`, `--annotated-output [file]` | Экспортировать аннотированное дерево                                |
| `-v`, `--vitals`                  | Показать метрики производительности                                 |
| `-p`, `--print-tree`              | Вывести дерево в терминал                                           |
| `-c`, `--config-path [path]`      | Указать путь к конфигурации (по умолчанию ищет в корне)             |
| `-g`, `--group-by <type>`         | Изменить группировку результатов сканирования (по умолчанию "path") |

Возможные значения для `--group-by`:

- `path` (по умолчанию) - группировка по пути в файловой системе:

  ```bash
  /src/views/HomePage/sections/MapSection/images/mw.svg
  ⚠ File size exceeds or falls short of the allowed configuration limits

  /src/views/HomePage/sections/MapSection/images/projects.svg
  ⚠ File size exceeds or falls short of the allowed configuration limits

  /src/views/HomePage/sections/MapSection
  ✖ Custom validation error: Custom rule must return a boolean, but returned object
  ```

- `severity` - группировка по уровню ошибки (`error`, `warning`):

  ```bash
  ✖ ERRORS:
  Custom validation error: Custom rule must return a boolean, but returned object
    - /src/layouts/MainLayout/sections/FooterSct

  ⚠ WARNINGS:
  It looks as component, but composition of child elements is invalid.
    - /src/layouts/MainLayout/components/NewAwesomeComponent
  Name of section does not match the required pattern or convention.
    - /src/layouts/MainLayout/sections/.HeaderSct
  ```

- `rule` - группировка по правилу, которое было нарушено:

  ```bash
  It looks as component, but composition of child elements is invalid.
    ⚠ /src/layouts/MainLayout/components/NewAwesomeComponent

  Name of section does not match the required pattern or convention.
    ⚠ /src/layouts/MainLayout/sections/.HeaderSct

  Custom validation error: Custom rule must return a boolean, but returned object
    ✖ /src/layouts/MainLayout/sections/FooterSct
    ✖ /src/layouts/MainLayout/sections/SidebarSct
  ```

Для удобства запуска сканирования можно добавить скрипт в `package.json`:

```json
{
  "scripts": {
    "lint:tree": "tree-lint scan"
  }
}
```

### 3. Проверьте результат сканирования

```text
Errors: 0, warnings: 0.

✔ Validation complete successfully!
```

```text
/src/views/HomePage/sections/MapSection/images/mw.svg
⚠ File size exceeds or falls short of the allowed configuration limits

/src/views/HomePage/sections/MapSection/images/projects.svg
⚠ File size exceeds or falls short of the allowed configuration limits

/src/views/HomePage/sections/MapSection
✖ Custom validation error: Custom rule must return a boolean, but returned object

Errors: 1, warnings: 2.

✖ Validation failed.
```

## Примеры архитектур

### Deep Tree

```bash
entities: {
  component: { /* ... */ },
  section: { /* ... */ },
  page: { /* ... */ },
  hook: { /* ... */ },
},

layers: {
  components: { entities: ["component"] },
  sections: { entities: ["section"] },
  pages: { entities: ["page"] },
  hooks: { entities: ["hook"] },
}
```

### Feature-Sliced Design (FSD)

```bash
entities: {
  feature: { /* ... */ },
  widget: { /* ... */ },
  entity: { /* ... */ },
},

layers: {
  app: { /* ... */ },
  pages: { /* ... */ },
  widgets: { entities: ["widget"] },
  features: { entities: ["feature"] },
  entities: { entities: ["entity"] },
  shared: { /* ... */ },
}
```

### Монорепо

```typescript
roots: ["packages/ui", "packages/core", "packages/api"],
// каждый корень сканируется независимо
```

## Лицензия

MIT
