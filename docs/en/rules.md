# Validation Rules

### Description of rules and parameters

| Rule             | Description           | Parameters            | Applicable to |
| :--------------- | :-------------------- | :-------------------- | :------------ |
| `name`           | Naming (glob)         | `pattern` (string)    | All           |
| `nameLength`     | Name length           | `min`, `max` (number) | All           |
| `size`           | Size                  | `min`, `max` (number) | All           |
| `lineCount`      | Number of lines       | `min`, `max` (number) | Files         |
| `childrenAmount` | Number of child nodes | `min`, `max` (number) | Folders       |
| `isEmpty`        | Emptiness check       | —                     | All           |
| `custom()`       | Custom check          | `callback` (function) | All           |

Custom check is only available in `.ts` and `.js` format configs. In `.json` and `.yaml` format configs, only predefined rules (e.g., `name`, `size`, `lineCount`, etc.) can be used with their parameters.

---

### Configuration Examples

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

### Available fields in the `node` object inside `custom()`

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

### Using `custom()` check

#### Callback signature:

```typescript
callback: (
  node: Node,
  results?: Partial<Record<string, IValidationResult>>[],
) => boolean;
```

- `results` — is an array of check results that were performed for this specific node during the current scan.
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

#### `custom()` usage examples:

##### File check:

```
{
  custom: {
    type: error,
    callback: (node) => {
      // Check: .ts files must not be empty
      if (node.extension === 'ts') {
        return node.lines > 0;
      }
      return true;
    }
  }
```

##### Entity check:

```
{
  custom: {
    type: warning,
    callback: (node) => {
      // Check: 'feature' entity must contain files
      if (node.entity === 'feature') {
        return node.children.length > 0;
      }
      return true;
    }
  }
}
```

##### Example using `results`:

```
{
custom: {
  type: "error",
  message: "Critical error: no validation rule passed!",
  callback: (node, results) => {
      // If the results array is empty, it means there were no other rules - skip
      if (!results || results.length === 0) return true;

      // Check if there is at least one successfully passed check
      const hasPassed = results.some(ruleResult => {
        // ruleResult - is an object of type { [ruleName]: IValidationResult }
        // We need to extract all values (this is IValidationResult)
        return Object.values(ruleResult).some(res => res.result === true);
      });

      // If hasPassed === false, it means ALL checks failed
      return hasPassed;
    }
  }
}
```
