export interface Validator {
  validate(): void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
