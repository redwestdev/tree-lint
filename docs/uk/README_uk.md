# Tree-lint

Tree-lint - це лінтер для файлової структури, який допомагає підтримувати архітектурний порядок та запобігати хаосу в проекті.

> Tree-lint не прив’язаний до конкретної архітектури. Ви описуєте свою архітектуру в конфігу, а Tree-lint перевіряє відповідність. Підтримує Deep Tree, FSD, монорепо та будь-які інші підходи, де можна виділити окремі шари та сутності.

## Навіщо використовувати Tree-lint?

Основні завдання, які вирішує лінтер:

- **Контроль архітектурної цілісності** - дозволяє зафіксувати правила розміщення файлів і папок. Лінтер автоматично відстежує порушення: наприклад, коли компоненти потрапляють у папку утиліт або шари проекту перемішуються.

- **Дотримання командних домовленостей** - перетворює архітектурні правила на специфікацію. Це допомагає розробникам дотримуватися єдиного стандарту роботи, мінімізуючи суперечки щодо того, де все має лежати.

- **Спрощення онбордингу** - конфігурація лінтера слугує наочною документацією. Новий учасник команди може швидко вивчити структуру, не витрачаючи час на пошук відповідей.

- **Гнучка робота в монорепо** - дозволяє налаштовувати окремі правила для різних частин проекту. Кожна команда може дотримуватися своєї архітектури, не порушуючи загальних стандартів монорепозиторію.

- **Аудит легасі-проектів** - інструмент дозволяє швидко оцінити стан файлової структури. Це незамінно при прийманні проектів із накопиченим технічним боргом, щоб зрозуміти, наскільки поточна організація файлів відповідає цільовій моделі.

- **Поступовий рефакторинг** - Переводите проєкт на нову архітектуру? Налаштуйте правила для нового коду та виключіть старі файли через патерни `ignore`. Не потрібно рефакторити все одразу, щоб почати отримувати користь від лінтера.

## Встановлення

```bash
npm install -D tree-lint
# або
yarn add -D tree-lint
# або
pnpm add -D tree-lint
```

## Швидкий старт

### 1. Створіть конфіг

У корені проекту виконайте команду для створення шаблону конфігу:

```bash
tree-lint init
```

Команда створює файл `tree-lint.config` у поточному каталозі. Підтримується інтерактивний та неінтерактивний режим.

**Інтерактивний режим** (TTY-термінал поза CI) — команда запитає відсутні параметри через prompt і запропонує підтвердження перед створенням файлу. Якщо вибір не влаштовує, можна повернутися й вказати параметри знову.

**Неінтерактивний режим** (CI) — усі параметри мають бути передані явно через прапорці:

```bash
tree-lint init --format ts --type deep-tree
```

| Прапорець             | Можливі значення   | Опис                      |
| --------------------- | ------------------ | ------------------------- |
| -f, --format <format> | ts, js, json, yaml | Формат файлу конфігурації |
| -t, --type <type>     | default, deep-tree | Шаблон конфігурації       |

Приклад структури проекту:

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── index.ts
└── pages/
    └── Home/
```

та файлу конфігурації:

```typescript
import { createConfig } from "tree-lint";

export default createConfig({
  roots: ["src"], // директорії для сканування
  ignore: ["node_modules", "dist", "**/**/*.test.ts"], // виключення, можна використовувати паттерни

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

[Детальніше о правилах перевірки](./rules_uk.md)

Підтримувані формати файлів конфігурації:

- `tree-lint.config.ts` (рекомендовано)
- `tree-lint.config.js`
- `tree-lint.config.json`
- `tree-lint.config.yaml`

При використанні конфігурацій у форматі `json` або `yaml` функціональність буде обмежена (немає підтримки кастомних правил через callback).

#### Безпека

> Конфігурація виконується як код (TypeScript).
>
> **Важливо:** Використовуйте Tree-lint лише з довіреними конфігураціями. Якщо ви берете конфіг зі стороннього джерела, переконайтеся в його безпеці, оскільки він може містити шкідливий код.

### 2. Запустіть сканування

```bash
tree-lint scan
```

#### Прапорці (flags) CLI

Підтримувані прапорці для команди `scan`:

| Прапорець                         | Опис                                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| `-t`, `--tree-output [file]`      | Експортувати JSON-дерево                                            |
| `-a`, `--annotated-output [file]` | Експортувати анотоване дерево                                       |
| `-v`, `--vitals`                  | Показати метрики продуктивності                                     |
| `-p`, `--print-tree`              | Вивести дерево в термінал                                           |
| `-c`, `--config-path [path]`      | Вказати шлях до конфігурації (за замовчуванням шукає в корені)      |
| `-g`, `--group-by <type>`         | Змінити групування результатів сканування (за замовчуванням "path") |

Можливі значення для `--group-by`:

- `path` (за замовчуванням) - групування за шляхом у файловій системі:

  ```bash
  /src/views/HomePage/sections/MapSection/images/mw.svg
  ⚠ File size exceeds or falls short of the allowed configuration limits

  /src/views/HomePage/sections/MapSection/images/projects.svg
  ⚠ File size exceeds or falls short of the allowed configuration limits

  /src/views/HomePage/sections/MapSection
  ✖ Custom validation error: Custom rule must return a boolean, but returned object
  ```

- `severity` - групування за рівнем помилки (`error`, `warning`):

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

- `rule` - групування за правилом, яке було порушене:

  ```bash
  It looks as component, but composition of child elements is invalid.
    ⚠ /src/layouts/MainLayout/components/NewAwesomeComponent

  Name of section does not match the required pattern or convention.
    ⚠ /src/layouts/MainLayout/sections/.HeaderSct

  Custom validation error: Custom rule must return a boolean, but returned object
    ✖ /src/layouts/MainLayout/sections/FooterSct
    ✖ /src/layouts/MainLayout/sections/SidebarSct
  ```

Для зручності запуску сканування можна додати скрипт у `package.json`:

```json
{
  "scripts": {
    "lint:tree": "tree-lint scan"
  }
}
```

### 3. Перевірте результат сканування

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

## Приклади архітектур

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
// кожен корінь сканується незалежно
```

## Ліцензія

[MIT](../../LICENSE)
