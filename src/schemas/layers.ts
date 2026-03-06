import { LayerSchema } from "../types/schema.js";

// Слой компонентов
export const componentsLayer: LayerSchema = {
  name: "components",
  directory: "components",
  description: "Переиспользуемые React компоненты",
  allowedEntityTypes: ["component", "ui"],
  required: false,
  icon: "🧩",
};
