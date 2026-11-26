# Validation Rules

### Common rule fields

Every rule is described by an object:

| Field     | Required | Description                                          |
| :-------- | :------- | :--------------------------------------------------- |
| `type`    | yes      | Violation level: `"error"` or `"warning"`            |
| `message` | no       | Custom violation text instead of the default message |

`error` is treated as an error and affects the scan result, `warning` is only a warning.

A rule can be disabled with the `"off"` string:

```typescript
rules: {
  nameLength: "off",
  isEmpty: "off",
}
```

The object form `{ type: "off" }` is also allowed, but required parameters still have to be specified: `{ type: "off", max: 20 }`.

Bare `"error"` and `"warning"` strings are accepted only for flag rules (e.g. `isEmpty`). Rules with parameters (`name`, `nameLength`, `size`, `lineCount`, `childrenAmount`, `custom`) need an object: there is nothing to check without limits or a callback.

---

### Description of rules and parameters

| Rule             | Description           | Parameters                                | Applicable to           |
| :--------------- | :-------------------- | :---------------------------------------- | :---------------------- |
| `name`           | Naming (glob)         | `pattern` (string, required)              | All nodes               |
| `nameLength`     | Name length           | `max` (number, required), `min` (number)  | All nodes               |
| `size`           | Size in kilobytes     | `min` and/or `max` (number), at least one | All nodes               |
| `lineCount`      | Number of lines       | `max` (number, required), `min` (number)  | Files                   |
| `isEmpty`        | File is not empty     | —                                         | Files                   |
| `childrenAmount` | Number of child nodes | `max` (number, required), `min` (number)  | Folders, layers, groups |
| `children`       | Rules for child nodes | Array of rules with `matches`             | Folders (entities)      |
| `custom`         | Custom check          | `callback` (function, required)           | All nodes               |

Default `min` values: `nameLength.min = 1`, `childrenAmount.min = 1`, `size.min = 0`. `lineCount.min` is not set — only the upper bound is checked.

If `size` has only `min`, the lower bound is checked; if only `max`, the upper bound is checked.

Custom checks are available only in `.ts`, `.js`, `.mjs` and `.mts` configs. In `.json` and `.yaml` configs only predefined rules (e.g. `name`, `size`, `lineCount`, etc.) with their parameters can be used, because a function cannot be serialized.

---

### Configuration Examples

Rules of a file entity:

```json
{
  "name": {
    "pattern": "^[a-z0-9-]+$",
    "type": "error",
    "message": "Name must contain only lowercase letters, numbers, and hyphens"
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

Rules of a folder:

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

### The `children` rule

`children` sets rules for the child nodes of a folder. Each entry of the array contains a `matches` selector and the rules assigned to matching children:

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

- `matches` supports `type` (`"file"` or `"directory"`) and `name` (glob). For `type: "directory"` you can additionally specify `children` — a nested array of selectors to check the composition of the folder.
- An entry without `matches` is ignored.
- Rules from an entry are applied to the direct child of the folder; they do not descend to nested levels.
- `children` works only in the rules of a folder entity. In layer and group rules this field is ignored.

---

### Available fields in the `node` object inside `custom`

The callback function `callback(node)` receives an object, the structure of which depends on the node type.

#### 1. Basic fields (available in all nodes)

```
{
  name: string;        // Name of the file or folder
  path: string;        // Full path to the node
  size: number;        // Size in bytes
  ignored: boolean;    // Is ignored by the configuration file
  unreadable: boolean; // Reading error
  hidden: boolean;     // Is hidden (name starts with ".")
}
```

Note: `node.size` is in bytes. The `size` rule compares the size in kilobytes.

#### 2. Additional fields for files (`FileNode`, `FileEntity`)

```
{
  ...BaseFields,
  extension: string;   // File extension (e.g., "ts")
  lines: number;       // Number of lines in the file
}
```

#### 3. Additional fields for directories (`DirNode`, `LayerNode`, `GroupNode`, `DirEntity`)

```
{
  ...BaseFields,
  children: TAnyNode[]; // Array of child nodes
}
```

#### 4. Additional fields for entities (`FileEntity`, `DirEntity`)

```
{
 ...BaseFields/FileFields/DirFields,
 entity: string;      // Entity type from configuration
}
```

---

### Using the `custom` check

#### Callback signature:

```typescript
callback: (
  node: Node,
  results?: Partial<Record<string, IValidationResult>>[],
) => boolean;
```

- `results` is an array of check results that were performed for this specific node during the current scan.
- Only those checks for which parameters were explicitly specified in the config (e.g., `nameLength`, `size`, `lineCount`, etc.) are included in `results`.

#### `IValidationResult` structure:

```typescript
interface IValidationResult {
  result: boolean; // true, if check passed
  violation?: {
    // Error data, if check failed
    type: "error" | "warning";
    path: string;
    message: string;
  };
}
```

#### `custom` usage examples:

##### File check:

```typescript
{
  custom: {
    type: "error",
    callback: (node) => {
      // Check: .ts files must not be empty
      if (node.extension === "ts") {
        return node.lines > 0;
      }
      return true;
    },
  },
}
```

##### Entity check:

```typescript
{
  custom: {
    type: "warning",
    callback: (node) => {
      // Check: "feature" entity must contain files
      if (node.entity === "feature") {
        return node.children.length > 0;
      }
      return true;
    },
  },
}
```

##### Example using `results`:

```typescript
{
  custom: {
    type: "error",
    message: "Critical error: no validation rule passed!",
    callback: (node, results) => {
      // If the results array is empty, it means there were no other rules - skip
      if (!results || results.length === 0) return true;

      // Check if there is at least one successfully passed check
      const hasPassed = results.some((ruleResult) => {
        // ruleResult is an object of type { [ruleName]: IValidationResult }
        // We need to extract all values (this is IValidationResult)
        return Object.values(ruleResult).some((res) => res.result === true);
      });

      // If hasPassed === false, it means ALL checks failed
      return hasPassed;
    },
  },
}
```
