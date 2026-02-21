/**
 * Схема описания сущности
 */
export interface EntitySchema {
  // Уникальный идентификатор типа
  type: string; // 'page', 'section', 'component'

  // Человекочитаемое название
  displayName: string; // "React Component", "Page", "Modal Window"

  // Описание сущности
  description?: string; // "Страница приложения с секциями и компонентами"

  // Правила распознавания
  detection: EntityDetectionRules;

  // Требования к структуре файлов
  structure: EntityStructure;

  // Разрешённые функциональные слои
  allowedLayers?: string[]; // ['components', 'sections', 'utils', 'hooks']

  // Разрешённые типы дочерних сущностей
  allowedChildren?: string[]; // ['section', 'component', 'ui']

  // Может ли быть корневой сущностью (в src/)
  canBeRoot?: boolean; // true для page, false для component

  // Дополнительные опции
  options?: EntityOptions;
}

/**
 * Правила распознавания сущности
 */
export interface EntityDetectionRules {
  // Паттерны для имени
  namePatterns?: NamePattern[];

  // Правила расположения в файловой системе
  locationRules?: LocationRule[];

  // Правила по содержимому (какие файлы должны быть)
  fileRules?: FileRule[];

  // Приоритет при конфликте (больше = выше приоритет)
  priority?: number; // 1-10, default: 5
}

/**
 * Паттерн имени
 */
export interface NamePattern {
  // Паттерн для сопоставления
  pattern: string; // '^[A-Z]', '_Page$', '*.component'

  // Тип паттерна
  type: "regex" | "glob" | "suffix" | "prefix" | "exact";

  // Уверенность (0-1), если паттерн совпал
  confidence: number; // 0.0 - 1.0

  // Описание для отладки
  description?: string; // "Имя начинается с заглавной буквы"
}

/**
 * Правило расположения
 */
export interface LocationRule {
  // Имя родительской директории
  parentDirectory?: string; // 'components', 'pages', 'sections'

  // Глубина вложенности
  depth?: number | DepthRange; // 2 или { min: 1, max: 3 }

  // Тип родительской сущности
  parentEntityType?: string; // 'page', 'section'

  // Путь должен соответствовать glob паттерну
  pathPattern?: string; // 'src/pages/**', 'packages/*/src/**'

  // Уверенность, если правило выполнено
  confidence: number; // 0.0 - 1.0

  // Описание
  description?: string;
}

export interface DepthRange {
  min?: number; // Минимальная глубина
  max?: number; // Максимальная глубина
}

/**
 * Правило по файлам
 */
export interface FileRule {
  // Файлы, которые ДОЛЖНЫ присутствовать (хотя бы один из)
  mustHave?: string[]; // ['index.ts', 'index.tsx']

  // Файлы, которые МОГУТ присутствовать
  mayHave?: string[]; // ['*.module.scss', '*.test.tsx']

  // Файлы, которых НЕ ДОЛЖНО быть
  mustNotHave?: string[]; // ['*.spec.js', '*.backup']

  // Минимальное количество файлов
  minFiles?: number; // 2

  // Максимальное количество файлов
  maxFiles?: number; // 10

  // Уверенность
  confidence: number;

  // Описание
  description?: string;
}

/**
 * Структура файлов сущности
 */
export interface EntityStructure {
  // Обязательные файлы
  required?: FileRequirement[];

  // Опциональные файлы
  optional?: FileRequirement[];

  // Запрещённые файлы/паттерны
  forbidden?: string[]; // ['*.backup', '*.tmp', 'old_*']

  // Максимальное количество файлов в сущности
  maxFiles?: number; // 20
}

/**
 * Требование к файлу
 */
export interface FileRequirement {
  // Паттерн имени файла (поддерживает {entityName})
  pattern: string; // 'index.{ts,tsx}', '{entityName}.tsx'

  // Описание файла (для сообщений об ошибках)
  description: string; // "Entry point", "Main component file"

  // Разрешённые расширения
  extensions?: string[]; // ['.ts', '.tsx', '.js', '.jsx']

  // Примеры валидных имён
  examples?: string[]; // ['Button.tsx', 'Button.jsx']
}

/**
 * Дополнительные опции сущности
 */
export interface EntityOptions {
  // Соглашения именования
  namingConvention?: NamingConvention;

  // Максимальная глубина вложенности дочерних сущностей
  maxChildDepth?: number; // 3

  // Требовать определённое количество дочерних сущностей
  requireChildren?: number | { min?: number; max?: number };

  // Кастомные метаданные
  metadata?: Record<string, any>;
}

export type NamingConvention =
  | "PascalCase" // HomePage, UserProfile
  | "camelCase" // homePage, userProfile
  | "kebab-case" // home-page, user-profile
  | "snake_case"; // home_page, user_profile

/**
 * Схема функционального слоя
 */
export interface LayerSchema {
  // Название слоя
  name: string; // 'components', 'utils', 'hooks'

  // Название директории
  directory: string; // 'components', 'utils', 'hooks'

  // Описание
  description?: string; // "Переиспользуемые компоненты"

  // Какие типы сущностей могут находиться в этом слое
  allowedEntityTypes?: string[]; // ['component', 'ui']

  // Структура файлов внутри слоя (если не сущности)
  fileStructure?: LayerFileStructure;

  // Обязателен ли этот слой
  required?: boolean; // false

  // Иконка для визуализации
  icon?: string; // '📦', '🧩', '🎨'
}

/**
 * Структура файлов внутри слоя
 */
export interface LayerFileStructure {
  // Паттерны разрешённых файлов
  allowedPatterns?: string[]; // ['*.ts', '*.tsx', 'use*.ts']

  // Паттерны запрещённых файлов
  forbiddenPatterns?: string[]; // ['*.js', '*.jsx']

  // Соглашения именования файлов
  namingConvention?: NamingConvention;

  // Максимальное количество файлов
  maxFiles?: number; // 50
}
