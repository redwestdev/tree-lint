import { Entity } from "./entities";

/**
 * Результат сканирования
 */
export interface ScanResult {
  // Найденные компоненты
  components: Entity[];

  // Статистика
  stats: ScanStats;

  // Время выполнения
  duration: number;
}

export interface ScanStats {
  totalComponents: number;
  totalFiles: number;
  maxDepth: number;
  avgDepth: number;
}
