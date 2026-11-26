# Правила валидации

### Общие поля правила

Каждое правило описывается объектом:

| Поле      | Обязательное | Описание                                           |
| :-------- | :----------- | :------------------------------------------------- |
| `type`    | да           | Уровень нарушения: `"error"` или `"warning"`       |
| `message` | нет          | Свой текст нарушения вместо стандартного сообщения |

`error` считается ошибкой и влияет на итог сканирования, `warning` — только предупреждение.

Правило можно отключить строкой `"off"`:

```typescript
rules: {
  nameLength: "off",
  isEmpty: "off",
}
```

Объектная форма `{ type: "off" }` тоже допустима, но обязательные параметры в ней всё равно нужно указать: `{ type: "off", max: 20 }`.

Строки `"error"` и `"warning"` без параметров принимаются только у флаговых правил (например, `isEmpty`). Для правил с параметрами (`name`, `nameLength`, `size`, `lineCount`, `childrenAmount`, `custom`) нужен объект: проверке нечего исполнять без границ или колбека.

---

### Описание правил и параметры

| Правило          | Описание                   | Параметры                                      | Применимо к         |
| :--------------- | :------------------------- | :--------------------------------------------- | :------------------ |
| `name`           | Именование (glob)          | `pattern` (string, обязателен)                 | Все узлы            |
| `nameLength`     | Длина имени                | `max` (number, обязателен), `min` (number)     | Все узлы            |
| `size`           | Размер в килобайтах        | `min` и/или `max` (number), нужен хотя бы один | Все узлы            |
| `lineCount`      | Кол-во строк               | `max` (number, обязателен), `min` (number)     | Файлы               |
| `isEmpty`        | Файл не пустой             | —                                              | Файлы               |
| `childrenAmount` | Кол-во дочерних узлов      | `max` (number, обязателен), `min` (number)     | Папки, слои, группы |
| `children`       | Правила для дочерних узлов | Массив правил с `matches`                      | Папки (сущности)    |
| `custom`         | Произвольная проверка      | `callback` (function, обязателен)              | Все узлы            |

Значения `min` по умолчанию: `nameLength.min = 1`, `childrenAmount.min = 1`, `size.min = 0`. `lineCount.min` не задан — проверяется только верхняя граница.

Если у `size` указан только `min`, проверяется нижняя граница; если только `max` — верхняя.

Произвольная проверка доступна только в `.ts`, `.js`, `.mjs` и `.mts` конфигах. В `.json` и `.yaml` можно использовать только предопределённые правила (напр., `name`, `size`, `lineCount` и т.д.) с их параметрами, потому что функцию нельзя сериализовать.

---

### Примеры конфигурации

Правила файловой сущности:

```json
{
  "name": {
    "pattern": "^[a-z0-9-]+$",
    "type": "error",
    "message": "Имя должно содержать только строчные буквы, цифры и дефисы"
  },
  "nameLength": {
    "min": 3,
    "max": 20,
    "type": "warning"
  },
  "size": {
    "min": 100,
    "max": 5000,
    "type": "error"
  },
  "lineCount": {
    "max": 200,
    "type": "error"
  },
  "isEmpty": "warning"
}
```

Правила папки:

```json
{
  "childrenAmount": {
    "min": 1,
    "max": 10,
    "type": "error"
  }
}
```

---

### Правило `children`

`children` задаёт правила для дочерних узлов папки. Каждая запись массива содержит селектор `matches` и правила, которые назначаются подходящим детям:

```typescript
rules: {
  children: [
    {
      matches: { type: "file", name: "*.tsx" },
      lineCount: { type: "warning", max: 200 },
    },
    {
      matches: { type: "directory", name: "libs" },
      childrenAmount: { type: "warning", max: 5 },
    },
  ],
}
```

- `matches` поддерживает `type` (`"file"` или `"directory"`) и `name` (glob). У `type: "directory"` можно дополнительно указать `children` — вложенный массив селекторов для проверки состава папки.
- Запись без `matches` игнорируется.
- Правила из записи применяются к прямому ребёнку папки; на вложенные уровни они не спускаются.
- `children` работает только в правилах сущности-папки. В правилах слоёв и групп это поле игнорируется.

---

### Доступные поля в объекте `node` внутри `custom`

В функцию обратного вызова `callback(node)` передается объект, структура которого зависит от типа узла.

#### 1. Базовые поля (доступны во всех нодах)

```
{
  name: string;        // Имя файла или папки
  path: string;        // Полный путь к узлу
  size: number;        // Размер в байтах
  ignored: boolean;    // Игнорируется ли файлом конфигурации
  unreadable: boolean; // Ошибка чтения
  hidden: boolean;     // Является ли скрытым (имя начинается с ".")
}
```

Обратите внимание: `node.size` — байты. Правило `size` сравнивает размер в килобайтах.

#### 2. Дополнительные поля для файлов (`FileNode`, `FileEntity`)

```
{
  ...BaseFields,
  extension: string;   // Расширение файла (напр., "ts")
  lines: number;       // Количество строк в файле
}
```

#### 3. Дополнительные поля для директорий (`DirNode`, `LayerNode`, `GroupNode`, `DirEntity`)

```
{
  ...BaseFields,
  children: TAnyNode[]; // Массив дочерних узлов
}
```

#### 4. Дополнительные поля для сущностей (`FileEntity`, `DirEntity`)

```
{
 ...BaseFields/FileFields/DirFields,
 entity: string;      // Тип сущности из конфигурации
}
```

---

### Использование `custom` проверки

#### Сигнатура колбека:

```typescript
callback: (
  node: Node,
  results?: Partial<Record<string, IValidationResult>>[],
) => boolean;
```

- `results` — это массив результатов проверок, которые были выполнены для данного конкретного узла в рамках текущего сканирования.
- В `results` попадают только те проверки, для которых в конфиге были явно указаны параметры (напр., `nameLength`, `size`, `lineCount` и т.д.).

#### Структура `IValidationResult`:

```typescript
interface IValidationResult {
  result: boolean; // true, если проверка пройдена
  violation?: {
    // Данные об ошибке, если проверка не пройдена
    type: "error" | "warning";
    path: string;
    message: string;
  };
}
```

#### Примеры использования `custom`:

##### Проверка файла:

```typescript
{
  custom: {
    type: "error",
    callback: (node) => {
      // Проверка: файлы .ts не должны быть пустыми
      if (node.extension === "ts") {
        return node.lines > 0;
      }
      return true;
    },
  },
}
```

##### Проверка сущности:

```typescript
{
  custom: {
    type: "warning",
    callback: (node) => {
      // Проверка: сущность "feature" должна содержать файлы
      if (node.entity === "feature") {
        return node.children.length > 0;
      }
      return true;
    },
  },
}
```

##### Пример с использованием `results`:

```typescript
{
  custom: {
    type: "error",
    message: "Критическая ошибка: ни одно правило валидации не пройдено!",
    callback: (node, results) => {
      // Если массив results пуст, значит не было других правил - пропускаем
      if (!results || results.length === 0) return true;

      // Проверяем, есть ли хотя бы одна успешно пройденная проверка
      const hasPassed = results.some((ruleResult) => {
        // ruleResult - это объект типа { [ruleName]: IValidationResult }
        // Нам нужно извлечь все значения (это IValidationResult)
        return Object.values(ruleResult).some((res) => res.result === true);
      });

      // Если hasPassed === false, значит ВСЕ проверки провалены
      return hasPassed;
    },
  },
}
```
