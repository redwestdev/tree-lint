# Правила валідації

### Опис правил та параметри

| Правило          | Опис                      | Параметри             | Застосовується до |
| :--------------- | :------------------------ | :-------------------- | :---------------- |
| `name`           | Іменування (glob)         | `pattern` (string)    | Всі               |
| `nameLength`     | Довжина імені             | `min`, `max` (number) | Всі               |
| `size`           | Розмір                    | `min`, `max` (number) | Всі               |
| `lineCount`      | Кількість рядків          | `min`, `max` (number) | Файли             |
| `childrenAmount` | Кількість дочірніх вузлів | `min`, `max` (number) | Папки             |
| `isEmpty`        | Перевірка на порожнечу    | —                     | Всі               |
| `custom()`       | Довільна перевірка        | `callback` (function) | Всі               |

Довільна перевірка доступна лише в конфігах формату `.ts` та `.js`. У конфігах формату `.json` та `.yaml` можна використовувати лише попередньо визначені правила (напр., `name`, `size`, `lineCount` тощо) з їхніми параметрами.

---

### Приклади конфігурації

```json
{
  "name": {
    "pattern": "^[a-z0-9-]+$",
    "type": "error",
    "message": "Ім'я повинно містити лише малі літери, цифри та дефіси"
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

### Доступні поля в об'єкті `node` всередині `custom()`

У функцію зворотного виклику `callback(node)` передається об'єкт, структура якого залежить від типу вузла.

#### 1. Базові поля (доступні в усіх нодах)

```
{
  name: string;        // Ім'я файлу або папки
  path: string;        // Повний шлях до вузла
  size: number;        // Розмір у байтах
  ignored: boolean;    // Чи ігнорується файлом конфігурації
  unreadable: boolean; // Помилка читання
  hidden: boolean;     // Чи є прихованим (ім'я починається з ".")
}
```

#### 2. Додаткові поля для файлів (`FileNode`, `FileEntity`)

```
{
  ...BaseFields,
  extension: string;   // Розширення файлу (напр., "ts")
  lines: number;       // Кількість рядків у файлі
}
```

#### 3. Додаткові поля для директорій (`DirNode`, `LayerNode`, `GroupNode`, `DirEntity`)

```
{
  ...BaseFields,
  children: TAnyNode[]; // Масив дочірніх вузлів
}
```

#### 4. Додаткові поля для сутностей (`FileEntity`, `DirEntity`)

```
{
 ...BaseFields/FileFields/DirFields,
 entity: string;      // Тип сутності з конфігурації
}
```

---

### Використання перевірки `custom()`

#### Сигнатура колбека:

```typescript
callback: (
  node: Node,
  results?: Partial<Record<string, IValidationResult>>[],
) => boolean;
```

- `results` — це масив результатів перевірок, які були виконані для цього конкретного вузла в рамках поточного сканування.
- До `results` потрапляють лише ті перевірки, для яких у конфігу були явно вказані параметри (напр., `nameLength`, `size`, `lineCount` тощо).

#### Структура `IValidationResult`:

```typescript
interface IValidationResult {
  result: boolean; // true, якщо перевірка пройдена
  violation?: {
    // Дані про помилку, якщо перевірка не пройдена
    type: "error" | "warning";
    path: string;
    message: string;
  };
}
```

#### Приклади використання `custom()`:

##### Перевірка файлу:

```
{
  custom: {
    type: error,
    callback: (node) => {
      // Перевірка: файли .ts не повинні бути порожніми
      if (node.extension === 'ts') {
        return node.lines > 0;
      }
      return true;
    }
  }
```

##### Перевірка сутності:

```
{
  custom: {
    type: warning,
    callback: (node) => {
      // Перевірка: сутність 'feature' повинна містити файли
      if (node.entity === 'feature') {
        return node.children.length > 0;
      }
      return true;
    }
  }
}
```

##### Приклад з використанням `results`:

```
{
custom: {
  type: "error",
  message: "Критична помилка: жодне правило валідації не пройдено!",
  callback: (node, results) => {
      // Якщо масив results порожній, значить не було інших правил - пропускаємо
      if (!results || results.length === 0) return true;

      // Перевіряємо, чи є хоча б одна успішно пройдена перевірка
      const hasPassed = results.some(ruleResult => {
        // ruleResult - це об'єкт типу { [ruleName]: IValidationResult }
        // Нам потрібно витягти всі значення (це IValidationResult)
        return Object.values(ruleResult).some(res => res.result === true);
      });

      // Якщо hasPassed === false, значить ВСІ перевірки провалені
      return hasPassed;
    }
  }
}
```
