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

- **Постепенный рефакторинг** - при переводе проекта на новую архитектуру настройте правила для нового кода и исключите старые файлы через паттерны `ignore`. Не нужно рефакторить всё сразу, чтобы начать получать пользу от линтера.

## Установка

```bash
npm install -D @redwestdev/tree-lint
# или
yarn add -D @redwestdev/tree-lint
# или
pnpm add -D @redwestdev/tree-lint
```

## Быстрый старт

### 1. Создайте конфиг

В корне проекта выполните команду для создания шаблона конфига:

```bash
tree-lint init
```

Команда создаёт файл `tree-lint.config.<формат>` (например, `tree-lint.config.ts`) в текущем каталоге. Поддерживается интерактивный и неинтерактивный режим.

**Интерактивный режим** (TTY-терминал вне CI) - команда запросит недостающие параметры через prompt и предложит подтверждение перед созданием файла. Если выбор не устраивает, можно вернуться и указать параметры заново.

**Неинтерактивный режим** (CI) - все параметры должны быть переданы явно через флаги:

```bash
tree-lint init --format ts --type deep-tree
```

| Флаг                  | Возможные значения | Описание                  |
| --------------------- | ------------------ | ------------------------- |
| -f, --format <format> | ts, js, json, yaml | Формат файла конфигурации |
| -t, --type <type>     | default, deep-tree | Шаблон конфигурации       |

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
import { createConfig } from "@redwestdev/tree-lint";

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

Поля `roots` и `ignore` необязательны: по умолчанию сканируется текущий каталог (`roots: ["."]`), а `ignore` равен `["node_modules"]`. Обязательные поля конфига — `entities` и `layers`.

#### Отключение правил

Правило выключается строкой `"off"`:

```typescript
rules: {
  nameLength: "off",
  isEmpty: "off",
}
```

Объектная форма тоже работает, но у правил с параметрами обязательные поля всё равно нужно указать (`{ type: "off", max: 20 }`), поэтому строкой проще.

Строка `"error"` без параметров для правил с параметрами (`nameLength`, `size`, `lineCount` и т.д.) не принимается — нужен объект. Исключение — флаговые правила вроде `isEmpty`, у которых параметров нет.

[Подробнее о правилах проверки](./rules_ru.md)

Поддерживаемые форматы файлов конфигурации:

- `tree-lint.config.ts` (рекомендуется)
- `tree-lint.config.js`
- `tree-lint.config.mjs`
- `tree-lint.config.mts`
- `tree-lint.config.json`
- `tree-lint.config.yaml`
- `tree-lint.config.yml`

`tree-lint init` создаёт конфиги форматов `ts`, `js`, `json` и `yaml`. Остальные форматы (`mjs`, `mts`, `yml`) можно добавить вручную — `scan` их найдёт.

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
| `--report [file]`                 | Вывести JSON-отчёт о проверке в stdout или сохранить в файл         |
| `--no-fail-on-error`              | Завершить работу с кодом 0, даже если найдены ошибки проверки       |

`--report` отключает человекочитаемый вывод (спиннер, план сканирования, `--print-tree` и `--vitals`) и предназначен для интеграции с IDE и CI. Без имени файла отчёт выводится в stdout. Если указано имя файла, он сохраняется относительно корня сканируемого проекта, как и при использовании `--tree-output`.

> У `--report`, `-t` и `-a` значение необязательно, поэтому следующий позиционный аргумент будет воспринят как имя файла. Сначала укажите путь проекта: `tree-lint scan ./src --report`.

Пример отчёта:

```json
{
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "root": ["src/pages"],
  "errors": 1,
  "warnings": 0,
  "grouped": {
    "src/pages/components/Ui": {
      "error": ["Name length is outside the allowed character limits"],
      "warning": []
    }
  }
}
```

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

```typescript
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

```typescript
entities: {
  layout: { /* ... */ },
  page: { /* ... */ },
  widget: { /* ... */ },
  feature: { /* ... */ },
  entity: { /* ... */ },
  shared: { /* ... */ },
},

layers: {
  app: { entities: ["layout"] },
  pages: { entities: ["page"] },
  widgets: { entities: ["widget"] },
  features: { entities: ["feature"] },
  entities: { entities: ["entity"] },
  shared: { entities: ["shared"] },
}
```

Слой обязан перечислять хотя бы одну сущность: `layers.app: { /* ... */ }` без `entities` невалиден.

### Монорепо

```typescript
roots: ["packages/ui", "packages/core", "packages/api"],
// каждый корень сканируется независимо
```

## Группы

`groups` задаёт правила для папок, которые не описаны сущностями. Группа выбирается по `matches` (те же поля, что и у сущности: `type: "directory"` и `name`), а `rules` применяются к каждой подходящей папке:

```typescript
groups: {
  matches: {
    type: "directory",
    name: "[a-z]*",
  },
  rules: {
    nameLength: { type: "warning", max: 20 },
    childrenAmount: { type: "warning", max: 20 },
  },
}
```

Матчинг групп идёт после разметки сущностей: папка, ставшая сущностью, группой уже не станет. Сейчас конфиг описывает одну группу — `groups` это объект, а не словарь.

## Лицензия

[MIT](../../LICENSE)
