# Правила валидации

### Описание правил и параметры

| Правило          | Описание              | Параметры             | Применимо к |
| :--------------- | :-------------------- | :-------------------- | :---------- |
| `name`           | Именование (glob)     | `pattern` (string)    | Все         |
| `nameLength`     | Длина имени           | `min`, `max` (number) | Все         |
| `size`           | Размер                | `min`, `max` (number) | Все         |
| `lineCount`      | Кол-во строк          | `min`, `max` (number) | Файлы       |
| `childrenAmount` | Кол-во дочерних узлов | `min`, `max` (number) | Папки       |
| `isEmpty`        | Проверка пустоты      | —                     | Все         |
| `custom()`       | Произвольная проверка | `callback` (function) | Все         |

Произвольная проверка доступна только в конфигах формата `.ts` и `.js`. В конфигах формата `.json` и `.yaml` можно использовать только предопределенные правила (напр., `name`, `size`, `lineCount` и т.д.) с их параметрами.

---

### Примеры конфигурации

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
  "childrenAmount": {
    "min": 1,
    "max": 10,
    "type": "error"
  },
  "isEmpty": {
    "type": "error"
  }
}
```

---

### Доступные поля в объекте `node` внутри `custom()`

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

### Использование `custom()` проверки

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

#### Примеры использования `custom()`:

##### Проверка файла:

```
{
  custom: {
    type: error,
    callback: (node) => {
      // Проверка: файлы .ts не должны быть пустыми
      if (node.extension === 'ts') {
        return node.lines > 0;
      }
      return true;
    }
  }
```

##### Проверка сущности:

```
{
  custom: {
    type: warning,
    callback: (node) => {
      // Проверка: сущность 'feature' должна содержать файлы
      if (node.entity === 'feature') {
        return node.children.length > 0;
      }
      return true;
    }
  }
}
```

##### Пример с использованием `results`:

```
{
custom: {
  type: "error",
  message: "Критическая ошибка: ни одно правило валидации не пройдено!",
  callback: (node, results) => {
      // Если массив results пуст, значит не было других правил - пропускаем
      if (!results || results.length === 0) return true;

      // Проверяем, есть ли хотя бы одна успешно пройденная проверка
      const hasPassed = results.some(ruleResult => {
        // ruleResult - это объект типа { [ruleName]: IValidationResult }
        // Нам нужно извлечь все значения (это IValidationResult)
        return Object.values(ruleResult).some(res => res.result === true);
      });

      // Если hasPassed === false, значит ВСЕ проверки провалены
      return hasPassed;
    }
  }
}

```
