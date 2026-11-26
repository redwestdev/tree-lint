# Правила валідації

### Загальні поля правила

Кожне правило описується об'єктом:

| Поле      | Обов'язкове | Опис                                                      |
| :-------- | :---------- | :-------------------------------------------------------- |
| `type`    | так         | Рівень порушення: `"error"` або `"warning"`               |
| `message` | ні          | Власний текст порушення замість стандартного повідомлення |

`error` вважається помилкою і впливає на підсумок сканування, `warning` — лише попередження.

Правило можна вимкнути рядком `"off"`:

```typescript
rules: {
  nameLength: "off",
  isEmpty: "off",
}
```

Об'єктна форма `{ type: "off" }` теж допустима, але обов'язкові параметри в ній все одно потрібно вказати: `{ type: "off", max: 20 }`.

Рядки `"error"` і `"warning"` без параметрів приймаються лише у флагових правил (наприклад, `isEmpty`). Для правил із параметрами (`name`, `nameLength`, `size`, `lineCount`, `childrenAmount`, `custom`) потрібен об'єкт: перевірці нема чого виконувати без меж або колбека.

---

### Опис правил та параметри

| Правило          | Опис                        | Параметри                                         | Застосовується до  |
| :--------------- | :-------------------------- | :------------------------------------------------ | :----------------- |
| `name`           | Іменування (glob)           | `pattern` (string, обов'язковий)                  | Усі вузли          |
| `nameLength`     | Довжина імені               | `max` (number, обов'язковий), `min` (number)      | Усі вузли          |
| `size`           | Розмір у кілобайтах         | `min` та/або `max` (number), потрібен хоча б один | Усі вузли          |
| `lineCount`      | Кількість рядків            | `max` (number, обов'язковий), `min` (number)      | Файли              |
| `isEmpty`        | Файл не порожній            | —                                                 | Файли              |
| `childrenAmount` | Кількість дочірніх вузлів   | `max` (number, обов'язковий), `min` (number)      | Папки, шари, групи |
| `children`       | Правила для дочірніх вузлів | Масив правил із `matches`                         | Папки (сутності)   |
| `custom`         | Довільна перевірка          | `callback` (function, обов'язковий)               | Усі вузли          |

Значення `min` за замовчуванням: `nameLength.min = 1`, `childrenAmount.min = 1`, `size.min = 0`. `lineCount.min` не заданий — перевіряється лише верхня межа.

Якщо в `size` вказано лише `min`, перевіряється нижня межа; якщо лише `max` — верхня.

Довільна перевірка доступна лише в конфігах `.ts`, `.js`, `.mjs` та `.mts`. У `.json` і `.yaml` можна використовувати лише попередньо визначені правила (напр., `name`, `size`, `lineCount` тощо) з їхніми параметрами, тому що функцію неможливо серіалізувати.

---

### Приклади конфігурації

Правила файлової сутності:

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

`children` задає правила для дочірніх вузлів папки. Кожен запис масиву містить селектор `matches` і правила, які призначаються відповідним дітям:

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

- `matches` підтримує `type` (`"file"` або `"directory"`) і `name` (glob). Для `type: "directory"` можна додатково вказати `children` — вкладений масив селекторів для перевірки складу папки.
- Запис без `matches` ігнорується.
- Правила із запису застосовуються до безпосередньої дитини папки; на вкладені рівні вони не спускаються.
- `children` працює лише в правилах сутності-папки. У правилах шарів і груп це поле ігнорується.

---

### Доступні поля в об'єкті `node` всередині `custom`

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

Зверніть увагу: `node.size` — байти. Правило `size` порівнює розмір у кілобайтах.

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

### Використання перевірки `custom`

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

#### Приклади використання `custom`:

##### Перевірка файлу:

```typescript
{
  custom: {
    type: "error",
    callback: (node) => {
      // Перевірка: файли .ts не повинні бути порожніми
      if (node.extension === "ts") {
        return node.lines > 0;
      }
      return true;
    },
  },
}
```

##### Перевірка сутності:

```typescript
{
  custom: {
    type: "warning",
    callback: (node) => {
      // Перевірка: сутність "feature" повинна містити файли
      if (node.entity === "feature") {
        return node.children.length > 0;
      }
      return true;
    },
  },
}
```

##### Приклад з використанням `results`:

```typescript
{
  custom: {
    type: "error",
    message: "Критична помилка: жодне правило валідації не пройдено!",
    callback: (node, results) => {
      // Якщо масив results порожній, значить не було інших правил - пропускаємо
      if (!results || results.length === 0) return true;

      // Перевіряємо, чи є хоча б одна успішно пройдена перевірка
      const hasPassed = results.some((ruleResult) => {
        // ruleResult - це об'єкт типу { [ruleName]: IValidationResult }
        // Нам потрібно витягти всі значення (це IValidationResult)
        return Object.values(ruleResult).some((res) => res.result === true);
      });

      // Якщо hasPassed === false, значить ВСІ перевірки провалені
      return hasPassed;
    },
  },
}
```
